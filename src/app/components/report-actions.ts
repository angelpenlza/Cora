'use server';

/*
 * Server Actions: reporting workflow.
 *
 * `createReport` is invoked by the upload form and runs on the server. It:
 * - Ensures the user is authenticated (redirects to login if not).
 * - Validates required fields (title/description).
 * - Inserts a new row into `reports`.
 * - Best-effort sends a push notification to subscribers (non-fatal on failure).
 * - Revalidates the home page cache so the new report appears immediately.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendNewReportNotification } from '@/app/push/actions';
import {
  isReportFlagReasonCode,
  REPORT_FLAG_OTHER_MAX_LEN,
} from '@/lib/report-flag-reasons';
import {
  SIGN_IN_REQUIRED,
  VERIFICATION_REQUIRED,
} from '@/lib/report-auth-errors';
import type { ReportFlagReasonCode } from '@/lib/report-flag-reasons';
import { postImage } from './cfhelpers';

/**
 * Normalize form values: coerce `null` to empty string and trim whitespace.
 */
function trim(value: FormDataEntryValue | null): string {
  return (value ?? '').toString().trim();
}

function hasReportImageFile(file: unknown): file is File {
  return (
    file instanceof File &&
    file.size > 0 &&
    !!file.name &&
    file.name !== 'undefined'
  );
}

/**
 * Create a new report for the authenticated user.
 *
 * Expected fields (via `FormData`):
 * - `title`: report title (required)
 * - `description`: report details (required)
 *
 * Notes:
 * - `category_id` and `location` are currently hard-coded placeholders.
 * - Uses redirects for error handling and flow control.
 */
export async function createReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/pages/login?next=${encodeURIComponent('/pages/upload')}`,
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified, username')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.phone_verified) {
    redirect(
      `/pages/upload?err=${encodeURIComponent(
        'You must verify your phone number before you can create a report.',
      )}`,
    );
  }

  const title = trim(formData.get('title'));
  const description = trim(formData.get('description'));
  const image: File = formData.get('image') as File;
  const category = trim(formData.get('category'));
  const street = trim(formData.get('street'));
  const city = trim(formData.get('city'));
  const state = trim(formData.get('state'));
  const country = trim(formData.get('country'));

  if (!title || !description || !category) {
    redirect(
      `/pages/upload?report_err=${encodeURIComponent(
        'Missing fields.',
      )}`,
    );
  }

  const reportImageName = hasReportImageFile(image) ? image.name : null;

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_title: title,
      report_description: description,
      report_image: reportImageName,
      // Minimal required fields for reports table / RLS
      category_id: 1, // e.g. 'Safety' from current seed data
      category: category,
      address: `${street}, ${city}, ${state}, ${country}`,
      created_by: user.id,
      location: `POINT(0 0)`, // placeholder location; replace with real coordinates later
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating report', error);
    const isPermissionDenied = error?.code === '42501';
    const message = isPermissionDenied
      ? 'Database permission error. Reports table RLS may reference auth.users — use auth.uid() in policies instead.'
      : 'Failed to create report. Please try again.';
    redirect(
      `/pages/upload?report_err=${encodeURIComponent(message)}`,
    );
  }

  let notificationImageUrl: string | null = null;
  if (reportImageName && hasReportImageFile(image)) {
    const res = await postImage({
      image,
      database: 'cora-image-database',
      username: profile.username,
      rid: String(data.report_id),
    });
    if (
      res &&
      typeof res === 'object' &&
      'success' in res &&
      res.success === true &&
      'url' in res &&
      typeof (res as { url: unknown }).url === 'string'
    ) {
      notificationImageUrl = (res as { url: string }).url;
    }
  }

  try {
    const bodySnippet =
      description.length > 240 ? `${description.slice(0, 237)}…` : description;
    await sendNewReportNotification(
      data.report_title,
      bodySnippet,
      notificationImageUrl,
    );
  } catch (err) {
    console.error('Error sending new report notification', err);
  }

  revalidatePath('/', 'page');
  redirect('/');
}

// --- Voting and comments (interactive reports) ---
// Client code: result.error === SIGN_IN_REQUIRED → show sign-in gate (guest).
// result.error === VERIFICATION_REQUIRED → show phone verification (signed in, not verified).

/**
 * Get the current user's vote for a report (1 = upvote, -1 = downvote, 0 = none).
 */
export async function getReportVote(
  reportId: number,
  userId: string | null
): Promise<number> {
  if (!userId) return 0;
  const supabase = await createClient();
  const { data } = await supabase
    .from('votes')
    .select('vote')
    .eq('report_id', reportId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.vote ?? 0;
}

/**
 * Get the current user's vote for a report using auth on the server.
 * Use from the client when RSC payload may be cached (e.g. after voting then navigating).
 */
export async function getMyReportVote(reportId: number): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase
    .from('votes')
    .select('vote')
    .eq('report_id', reportId)
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.vote ?? 0;
}

/**
 * Get the current user's votes for multiple reports using auth on the server.
 * Use from the client to hydrate vote state (e.g. after server restart when RSC had no session).
 */
export async function getMyVotes(
  reportIds: number[]
): Promise<Record<number, number>> {
  if (!reportIds.length) return {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};
  const { data: rows } = await supabase
    .from('votes')
    .select('report_id, vote')
    .eq('user_id', user.id)
    .in('report_id', reportIds);
  const out: Record<number, number> = {};
  rows?.forEach((r) => {
    out[r.report_id] = r.vote;
  });
  return out;
}

/**
 * Set, update, or remove the current user's vote.
 * value: 1 = upvote, -1 = downvote, 0 = remove my vote.
 * Returns { error: SIGN_IN_REQUIRED } if not signed in, or { error: VERIFICATION_REQUIRED } if not phone-verified.
 */
export async function setReportVote(
  reportId: number,
  value: 1 | -1 | 0
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: SIGN_IN_REQUIRED };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.phone_verified) {
    return { error: VERIFICATION_REQUIRED };
  }

  const { error: rpcError } = await supabase.rpc('set_vote', {
    p_report_id: reportId,
    p_value: value,
  });

  if (rpcError) {
    if (rpcError.code === '42501' || rpcError.message?.includes('permission')) {
      return { error: VERIFICATION_REQUIRED };
    }
    console.error('set_vote RPC error', rpcError);
    return { error: `Failed to record vote: ${rpcError.message}` };
  }

  // Do not revalidate here: it triggers an immediate RSC refetch. The refetched payload
  // can have stale initialUserVote (e.g. 0) while score is already updated, so the client
  // sync effect overwrites optimistic state (button goes inactive, then next click shows 2).
  // Explore and report-detail are force-dynamic, so navigation loads fresh data.
  return {};
}

export type ReportCommentRow = {
  id: string;
  body: string;
  username: string;
  created_at: string;
};

/**
 * Get comment counts for multiple reports in one query. Returns report_id -> count.
 */
export async function getReportCommentCounts(
  reportIds: number[]
): Promise<Record<number, number>> {
  if (!reportIds.length) return {};
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('report_comments')
    .select('report_id')
    .in('report_id', reportIds);
  const out: Record<number, number> = {};
  reportIds.forEach((id) => {
    out[id] = 0;
  });
  rows?.forEach((r) => {
    out[r.report_id] = (out[r.report_id] ?? 0) + 1;
  });
  return out;
}

/**
 * Get comments for a report with username (from profiles).
 */
export async function getReportComments(
  reportId: number
): Promise<ReportCommentRow[]> {
  const supabase = await createClient();
  const { data: comments } = await supabase
    .from('report_comments')
    .select('id, body, created_at, user_id')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });

  if (!comments?.length) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds);
  const profileMap = new Map(
    profilesData?.map((p) => [p.id, p.username ?? 'Unknown']) ?? []
  );

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    username: profileMap.get(c.user_id) ?? 'Unknown',
    created_at: c.created_at,
  }));
}

/**
 * Create a comment on a report. Returns SIGN_IN_REQUIRED or VERIFICATION_REQUIRED when applicable.
 */
export async function createReportComment(
  reportId: number,
  body: string
): Promise<{ error?: string }> {
  const trimmed = (body ?? '').toString().trim();
  if (!trimmed) return { error: 'Comment cannot be empty.' };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: SIGN_IN_REQUIRED };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.phone_verified) {
    return { error: VERIFICATION_REQUIRED };
  }

  const { error: insertError } = await supabase.from('report_comments').insert({
    report_id: reportId,
    user_id: user.id,
    body: trimmed,
  });

  if (insertError) {
    console.error('Error inserting comment', insertError);
    return { error: 'Failed to post comment.' };
  }

  revalidatePath(`/pages/explore/${reportId}`);
  return {};
}

/**
 * Submit a moderation flag on a report. Requires phone-verified user.
 * Returns SIGN_IN_REQUIRED or VERIFICATION_REQUIRED when applicable.
 */
export async function submitReportFlag(
  reportId: number,
  reasonCode: string,
  details?: string | null
): Promise<{ error?: string }> {
  if (!Number.isFinite(reportId) || reportId < 1) {
    return { error: 'Invalid report.' };
  }

  if (!isReportFlagReasonCode(reasonCode)) {
    return { error: 'Please choose a valid reason.' };
  }

  const trimmedDetails = (details ?? '').toString().trim();
  if (reasonCode === 'other') {
    if (!trimmedDetails) {
      return { error: 'Please describe your reason when selecting Other.' };
    }
    if (trimmedDetails.length > REPORT_FLAG_OTHER_MAX_LEN) {
      return {
        error: `Details must be at most ${REPORT_FLAG_OTHER_MAX_LEN} characters.`,
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: SIGN_IN_REQUIRED };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.phone_verified) {
    return { error: VERIFICATION_REQUIRED };
  }

  const { data: reportRow } = await supabase
    .from('reports')
    .select('created_by')
    .eq('report_id', reportId)
    .maybeSingle();

  if (!reportRow) {
    return { error: 'Report not found.' };
  }

  if (reportRow.created_by === user.id) {
    return { error: 'You cannot report your own report.' };
  }

  const payload: {
    report_id: number;
    reporter_id: string;
    reason_code: ReportFlagReasonCode;
    details: string | null;
  } = {
    report_id: reportId,
    reporter_id: user.id,
    reason_code: reasonCode,
    details: reasonCode === 'other' ? trimmedDetails : null,
  };

  const { error: insertError } = await supabase
    .from('report_user_flags')
    .insert(payload);

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'You have already reported this.' };
    }
    console.error('Error inserting report_user_flags', insertError);
    return { error: 'Could not submit report. Please try again.' };
  }

  revalidatePath(`/pages/reports/${reportId}`);
  revalidatePath('/pages/reports');
  revalidatePath('/');
  return {};
}

