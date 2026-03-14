'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createReport } from '@/app/components/report-actions';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';

/**
 * Upload form for creating a new report.
 *
 * Props:
 * - `user`: Supabase user or `null` (passed from the server page).
 * - `phoneVerified`: whether the user has verified their phone (so we can show the modal on load if not).
 *
 * Form:
 * - Posts to the `createReport` server action.
 * - Shows the phone verification modal as soon as the user lands on this page if they are
 *   logged in but not phone-verified (so they don't fill the form and then get blocked on submit).
 * - Also shows the modal when redirected with ?err= after a failed submit.
 */
export default function UploadForm({
  user,
  phoneVerified = true,
}: {
  user: User | null;
  phoneVerified?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const err = searchParams.get('err');
  const reportErr = searchParams.get('report_err');
  const [dismissedHere, setDismissedHere] = useState(false);
  const showPhoneModal =
    !!err || ((!!user && !phoneVerified) && !dismissedHere);

  const handleCloseModal = () => {
    setDismissedHere(true);
    router.replace('/pages/upload');
  };

  return (
    <>
      <PhoneVerificationModal
        open={showPhoneModal}
        onVerifyLater={handleCloseModal}
        onVerifyNow={() => router.push('/pages/verify-phone')}
      />
      <form action={createReport} className="upload-form">
        <h1>Upload</h1>
        {reportErr && (
          <p className="error" role="alert">
            {reportErr}
          </p>
        )}
      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" required />

      <label htmlFor="category">Category</label>
      <input id="category" name="category" type="text" />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" rows={3} required />

      <label htmlFor="image">Image</label>
      <input id="image" name="image" type="file" accept="image/png, image/jpeg" />

      <button type="submit">Submit report</button>
      </form>
    </>
  );
}