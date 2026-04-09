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
import { postImage } from './cfhelpers';
import { report } from 'process';

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

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_title: title,
      report_description: description,
      report_image: image.name != 'undefined' ? image.name : null,
      // Minimal required fields for reports table / RLS
      category_id: 1, // e.g. 'Safety' from current seed data
      category: category,
      address: `${street}, ${city}, ${state}, ${country}`,
      created_by: user.id,
      location: `POINT(0 0)`, // placeholder location; replace with real coordinates later
    })
    .select('*')
    .single();

  if(data && image) {
    const res = await postImage({
      image: image, 
      database: 'cora-image-database', 
      username: profile.username, 
      rid: data.report_id, 
    })
    console.log('res: ', res)
  }

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

  try {
    await sendNewReportNotification(data.report_title);
  } catch (err) {
    console.error('Error sending new report notification', err);
  }

  revalidatePath('/', 'page');
  redirect('/');
}

