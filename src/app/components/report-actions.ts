'use server';

/**
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

/**
 * Normalize form values: coerce `null` to empty string and trim whitespace.
 */
function trim(value: FormDataEntryValue | null): string {
  return (value ?? '').toString().trim();
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
    redirect('/pages/login');
  }

  const title = trim(formData.get('title'));
  const description = trim(formData.get('description'));

  if (!title || !description) {
    redirect(
      `/pages/upload?err=${encodeURIComponent(
        'Title and description are required.',
      )}`,
    );
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_title: title,
      report_description: description,
      // Minimal required fields for reports table / RLS
      category_id: 1, // e.g. 'Safety' from current seed data
      created_by: user.id,
      location: 'POINT(0 0)', // placeholder location; replace with real coordinates later
    })
    .select('report_title')
    .single();

  if (error || !data) {
    console.error('Error creating report', error);
    redirect(
      `/pages/upload?err=${encodeURIComponent(
        'Failed to create report. Please try again.',
      )}`,
    );
  }

  try {
    await sendNewReportNotification(data.report_title);
  } catch (err) {
    console.error('Error sending new report notification', err);
  }

  revalidatePath('/', 'page');
  redirect('/');
}

