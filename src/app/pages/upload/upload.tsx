'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createReport } from '@/app/components/report-actions';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';
import { Dropdown } from '@/app/components/client-components';
import Link from 'next/link';
import Image from 'next/image';
import { AddressForms } from '@/app/components/autocomplete';

/** ~4 MiB — under Vercel’s ~4.5 MB Server Action / function body limit (multipart adds overhead). */
const MAX_REPORT_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Upload form for creating a new report.
 *
 * Props:
 * - `user`: Supabase user or `null` (passed from the server page).
 * - `phoneVerified`: whether the user has verified their phone (so we can show the modal on load if not).
 *
 * Form:
 * - Posts to the `createReport` server action.
 * - Guests: same modal shell with `variant="signIn"` (Not now / Sign in).
 * - Signed-in, not phone-verified: modal on load and when redirected with ?err= after submit.
 */
export default function UploadForm({
  user,
  phoneVerified = true,
}: {
  user: User | null;
  phoneVerified?: boolean;
}) {
  const [category, setCategory] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const err = searchParams.get('err');
  const reportErr = searchParams.get('report_err');
  const [dismissedHere, setDismissedHere] = useState(false);
  const [imageTooLarge, setImageTooLarge] = useState(false);
  const showPhoneModal =
    !!user &&
    (!!err || (!phoneVerified && !dismissedHere));


  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleCloseModal = () => {
    setDismissedHere(true);
    router.replace('/pages/upload');
  };

  const loginHref = `/pages/login?next=${encodeURIComponent('/pages/upload')}`;

  return (
    <>
      <PhoneVerificationModal
        open={!user}
        variant="signIn"
        onVerifyLater={() => router.push('/')}
        onVerifyNow={() => router.push(loginHref)}
      />
      <PhoneVerificationModal
        open={showPhoneModal}
        onVerifyLater={handleCloseModal}
        onVerifyNow={() => router.push('/pages/verify-phone')}
      />
      <div className='upload-card'>
        <div className='upload-container-header'>
          <Image 
            src='/assets/report-megaphone.png'
            alt=''
            width={30}
            height={30}
          />
          &ensp;
          Report Incident
        </div>
        {user ? (
        <form action={createReport} className='upload-container'>
          {reportErr && (
            <p className="error" role="alert">
              {reportErr}
            </p>
          )}

        <label className="upload-label">
          <Image 
            src='/assets/report-category-icon.png' 
            alt=''
            width={12}
            height={12}
          />
          &ensp;
          Category
        </label>
        <input id="category" name="category" type='hidden' value={category} required/>
        <Dropdown 
          options={[
            'Robbery', 
            'Traffic', 
            'Assault', 
            'Suspicious',
            'Vandalism',
            'Hazard', 
            'Other',
          ]}
          update={setCategory}
          category={category}
        />

        <label htmlFor="title" className='upload-label'>
          <Image 
            src='/assets/report-title-icon.png' 
            alt=''
            width={12}
            height={12}
          />
          &ensp;
          Title
        </label>
        <input 
          placeholder='Enter brief title.'
          id="title" 
          name="title" 
          type="text" 
          className='upload-input' 
          maxLength={50} 
          required 
        />

        <label className='upload-label'>
          <Image 
            src='/assets/report-location-icon.png' 
            alt=''
            width={12}
            height={12}
          />
          &ensp;
          Address
        </label>
        <AddressForms />

        <label htmlFor="description" className='upload-label'>
        <Image 
            src='/assets/report-description-icon.png' 
            alt=''
            width={12}
            height={12}
          />
          &ensp;
          Description
        </label>
        <textarea 
          placeholder='Provide a detailed account of what happened...'
          id="description" 
          name="description" 
          rows={2} 
          className='upload-input' 
          maxLength={400} 
          required 
        />

        <label htmlFor="image" className="upload-label">
          Photo (optional, PNG or JPEG, max ~4 MB)
        </label>
        <div className='upload-image'>
          {imagePreviewUrl ? (
            <div className="upload-image-preview" aria-live="polite">
              <img
                src={imagePreviewUrl}
                alt={imagePreviewName ? `Selected image: ${imagePreviewName}` : 'Selected image'}
                className="upload-image-preview-img"
              />
              <div className="upload-image-preview-meta">
                <div className="upload-image-preview-title">Image selected</div>
                {imagePreviewName && (
                  <div className="upload-image-preview-name">{imagePreviewName}</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Image 
                src='/assets/cloudflare-icon.png' 
                alt=''
                width={40}
                height={28}
                className='cloudflare-icon'
              />
              <p>Click to upload images.</p>
            </>
          )}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/png, image/jpeg"
            className="file-type"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) {
                setImageTooLarge(false);
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
                setImagePreviewName(null);
                return;
              }
              if (f.size > MAX_REPORT_IMAGE_BYTES) {
                setImageTooLarge(true);
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
                setImagePreviewName(null);
                e.target.value = '';
              } else {
                setImageTooLarge(false);
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(URL.createObjectURL(f));
                setImagePreviewName(f.name);
              }
            }}
          />
        </div>
        {imageTooLarge && (
          <p className="error" role="alert">
            That image is too large for upload. Use a file under 4 MB or compress it and try again.
          </p>
        )}

        <button type="submit" className='upload-button'>Submit</button>

        <Link href='/' className='return-to-home-page'>return to home page</Link>
        </form>
        ) : null}
      </div>
    </>
  );
}