'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendNewReportNotification } from '@/app/push/actions';

function trim(value: FormDataEntryValue | null): string {
  return (value ?? '').toString().trim();
}

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
      category_id: 1, // e.g. 'Safety' from your seed data
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

