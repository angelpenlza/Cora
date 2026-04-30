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
import { sendUserNotification } from '@/app/push/actions';
import { adminClient } from '@/lib/supabase/admin';
import {
  isReportFlagReasonCode,
  REPORT_FLAG_OTHER_MAX_LEN,
} from '@/lib/report-flag-reasons';
import type { ReportFlagReasonCode } from '@/lib/report-flag-reasons';
import {
  SIGN_IN_REQUIRED,
  VERIFICATION_REQUIRED,
} from '@/lib/report-auth-errors';
import { postImage } from './cfhelpers';
import { buildPublicR2Url, isPresignedUrl } from '@/lib/presigned-url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

let _r2: S3Client | null = null;
function getR2(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  const keyId = process.env.S3_KEY_ID;
  const secret = process.env.S3_SECRET_KEY;
  if (!endpoint || !keyId || !secret) return null;
  if (!_r2) {
    _r2 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: keyId, secretAccessKey: secret },
    });
  }
  return _r2;
}

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

function categoryLabelToId(label: string): number | null {
  const key = (label ?? '').toString().trim().toLowerCase();
  if (!key) return null;
  if (key === 'robbery') return 1;
  if (key === 'traffic') return 2;
  if (key === 'assault') return 3;
  if (key === 'suspicious') return 4;
  if (key === 'vandalism') return 5;
  if (key === 'hazard') return 6;
  if (key === 'other') return 7;
  return null;
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
  const lngRaw = trim(formData.get('lng'));
  const latRaw = trim(formData.get('lat'));

  const lng = lngRaw ? Number(lngRaw) : NaN;
  const lat = latRaw ? Number(latRaw) : NaN;
  const hasCoords =
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 90 &&
    !(lng === 0 && lat === 0);

  if (!title || !description || !category) {
    redirect(
      `/pages/upload?report_err=${encodeURIComponent(
        'Missing fields.',
      )}`,
    );
  }

  const reportImageName = hasReportImageFile(image) ? image.name : null;
  const categoryId = categoryLabelToId(category);

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_title: title,
      report_description: description,
      report_image: reportImageName,
      // Minimal required fields for reports table / RLS
      category_id: categoryId ?? 7,
      category: category,
      address: `${street}, ${city}, ${state}, ${country}`,
      created_by: user.id,
      // PostGIS point stored as "POINT(lng lat)" (WKT). Falls back to placeholder if no coords.
      location: hasCoords ? `POINT(${lng} ${lat})` : `POINT(0 0)`,
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

  // Upload image directly to R2 (skip the HTTP round-trip through /api/cloudflare).
  let notificationImageUrl: string | null = null;
  if (reportImageName && hasReportImageFile(image)) {
    const r2 = getR2();
    const imageKey = `${data.report_id}-${reportImageName}`;
    if (r2) {
      try {
        const bytes = await image.arrayBuffer();
        await r2.send(new PutObjectCommand({
          Bucket: 'cora-image-database',
          Key: imageKey,
          Body: Buffer.from(bytes),
        }));
        const imagePublicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_IMAGE_URL?.trim();
        if (imagePublicBase) {
          notificationImageUrl = `${imagePublicBase.replace(/\/$/, '')}/${imageKey}`;
        }
      } catch (err) {
        console.error('Error uploading report image to R2', err);
      }
    } else {
      // Fallback: use the HTTP API route if S3 env vars aren't available.
      await postImage({
        image,
        database: 'cora-image-database',
        username: profile.username,
        rid: String(data.report_id),
      });
    }
  }

  // Fire-and-forget: send notification without blocking the redirect.
  const bodySnippet =
    description.length > 240 ? `${description.slice(0, 237)}…` : description;
  const reportUrl = `/pages/reports/${data.report_id}`;
  sendNewReportNotification(
    data.report_title,
    bodySnippet,
    notificationImageUrl,
    reportUrl,
  ).catch((err) => console.error('Error sending new report notification', err));

  revalidatePath('/', 'page');
  revalidatePath('/pages/reports');
  revalidatePath('/pages/interactive-map');
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

  // Capture the current status before the vote updates it (best-effort).
  // Status is derived from score (see `reports_with_meta_updated` view / logic).
  const db = adminClient ?? supabase;
  const { data: before } = await db
    .from('reports_with_meta_updated')
    .select('status, created_by, report_title')
    .eq('report_id', reportId)
    .maybeSingle();
  const beforeStatus = (before?.status ?? null) as string | null;

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

  // After vote update, check for status transition and notify the author.
  try {
    const { data: after } = await db
      .from('reports_with_meta_updated')
      .select('status, created_by, report_title')
      .eq('report_id', reportId)
      .maybeSingle();

    const afterStatus = (after?.status ?? null) as string | null;
    const authorId = (after?.created_by ?? before?.created_by ?? null) as string | null;
    const reportTitle = (after?.report_title ?? before?.report_title ?? 'Your report') as string;

    const normalized = (s: string | null) => {
      if (!s) return null;
      const v = String(s).trim().toLowerCase();
      if (v === 'community-supported') return 'supported';
      return v;
    };

    const fromStatus = normalized(beforeStatus);
    const toStatus = normalized(afterStatus);

    if (authorId && toStatus && toStatus !== fromStatus && (toStatus === 'supported' || toStatus === 'disputed')) {
      const title =
        toStatus === 'supported'
          ? 'Your report is now community-supported'
          : 'Your report is now disputed';

      const body =
        toStatus === 'supported'
          ? `People in the community have supported “${reportTitle}”.`
          : `New votes have pushed “${reportTitle}” into disputed.`;

      await sendUserNotification({
        userId: authorId,
        title,
        body,
        url: `/pages/reports/${reportId}`,
      });
    }
  } catch (err) {
    console.error('Error sending status-change notification', err);
  }

  // Do not revalidate here: it triggers an immediate RSC refetch. The refetched payload
  // can have stale initialUserVote (e.g. 0) while score is already updated, so the client
  // sync effect overwrites optimistic state (button goes inactive, then next click shows 2).
  // Explore and report-detail are dynamically rendered, so navigation loads fresh data.
  return {};
}

export type ReportCommentRow = {
  id: string;
  body: string;
  username: string;
  avatar_url: string | null;
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
    .select('id, username, avatar_url, avatar_name')
    .in('id', userIds);

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_AVATAR_URL;
  const profileMap = new Map<
    string,
    { username: string; avatar_url: string | null }
  >(
    profilesData?.map((p) => {
      const rawUrl = typeof p.avatar_url === 'string' ? p.avatar_url.trim() : '';
      let url: string | null = null;
      if (rawUrl && !isPresignedUrl(rawUrl)) {
        url = rawUrl;
      } else {
        url = buildPublicR2Url(publicBase, p.avatar_name);
      }
      return [
        p.id,
        {
          username: p.username ?? 'Unknown',
          avatar_url: url,
        },
      ];
    }) ?? []
  );

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    username: profileMap.get(c.user_id)?.username ?? 'Unknown',
    avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
    created_at: c.created_at,
  }));
}

/**
 * Create a comment on a report. Returns SIGN_IN_REQUIRED or VERIFICATION_REQUIRED when applicable.
 */
export async function createReportComment(
  reportId: number,
  body: string
): Promise<{ error?: string; comment?: ReportCommentRow }> {
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
    .select('phone_verified, username, avatar_url, avatar_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.phone_verified) {
    return { error: VERIFICATION_REQUIRED };
  }

  const { data: insertedComment, error: insertError } = await supabase
    .from('report_comments')
    .insert({
      report_id: reportId,
      user_id: user.id,
      body: trimmed,
    })
    .select('id, body, created_at')
    .single();

  if (insertError) {
    console.error('Error inserting comment', insertError);
    return { error: 'Failed to post comment.' };
  }

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_AVATAR_URL;
  const rawAvatarUrl = typeof profile?.avatar_url === 'string' ? profile.avatar_url.trim() : '';
  let avatarUrl: string | null = null;
  if (rawAvatarUrl && !isPresignedUrl(rawAvatarUrl)) {
    avatarUrl = rawAvatarUrl;
  } else {
    avatarUrl = buildPublicR2Url(publicBase, profile?.avatar_name);
  }

  revalidatePath(`/pages/reports/${reportId}`);
  return {
    comment: {
      id: insertedComment.id,
      body: insertedComment.body,
      created_at: insertedComment.created_at,
      username: profile?.username ?? 'Unknown',
      avatar_url: avatarUrl,
    },
  };
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

