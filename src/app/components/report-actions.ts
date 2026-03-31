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

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
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
  const address = trim(formData.get('address'));

  if (!title || !description || !category || !address) {
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
      address: address,
      created_by: user.id,
      location: 'POINT(0 0)', // placeholder location; replace with real coordinates later
    })
    .select('*')
    .single();

  if(data) {
    const imageFormData = new FormData();
    imageFormData.append('rid', data.report_id);
    imageFormData.append('image', image)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOME_PAGE}/api/cloudflare`, {
        method: 'POST', 
        body: imageFormData,
      })
      
      const recv = await response.json();
      if(!recv.success) {
        console.log('failed to upload image')
        // redirect(`/pages/upload?err=${recv.message}`)
      } 
      console.log('success: ', recv.message)
      // redirect('/')

    } catch(err) {
      console.log('error: ', err)
      // redirect(`/pages/upload?err=${err}`)
    }
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

