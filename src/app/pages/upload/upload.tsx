'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createReport } from '@/app/components/report-actions';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';
import { Dropdown } from '@/app/components/client-components';
import Link from 'next/link';

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
  const [category, setCategory] = useState('');
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
    <div>
      <PhoneVerificationModal
        open={showPhoneModal}
        onVerifyLater={handleCloseModal}
        onVerifyNow={() => router.push('/pages/verify-phone')}
      />
      <form action={createReport} className='upload-container'>
        <h1>Upload</h1>
        {reportErr && (
          <p className="error" role="alert">
            {reportErr}
          </p>
        )}

      <label className="upload-label">Category</label>
      <input id="category" name="category" type='hidden' value={category} required/>
      <Dropdown 
        options={[
          'Robbery', 
          'Traffic', 
          'Assault', 
          'Suspicious Activity'
        ]}
        update={setCategory}
        category={category}
        />

      <label htmlFor="title" className='upload-label'>Title</label>
      <input id="title" name="title" type="text" className='upload-input' maxLength={50} required />

      <label htmlFor='address' className='upload-label'>Address</label>
      <input id='address' name='address' className='upload-input' />

      <label htmlFor="description" className='upload-label'>Description</label>
      <textarea id="description" name="description" rows={3} className='upload-input' maxLength={400} required />

      <input id="image" name="image" type="file" accept="image/png, image/jpeg" className='upload-image' />

      <button type="submit">Submit report</button>

      <Link href='/' className='return-to-home-page'>return to home page</Link>
      </form>
    </div>
  );
}