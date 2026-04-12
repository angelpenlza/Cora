'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';

const STORAGE_KEY = 'phone-verification-dismissed';

type PhoneVerificationWrapperProps = {
  user: User | null;
  phoneVerified: boolean;
};

/**
 * Renders the phone verification modal when the user is signed in, not yet
 * phone-verified, and has not dismissed the modal this session (sessionStorage).
 */
export default function PhoneVerificationWrapper({
  user,
  phoneVerified,
}: PhoneVerificationWrapperProps) {
  const router = useRouter();
  /** Must match SSR first paint; read sessionStorage only after mount (see useEffect). */
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
        setDismissedThisSession(true);
      }
    } catch {
      /* ignore (e.g. private mode) */
    }
  }, []);

  const showModal =
    !!user && !phoneVerified && !dismissedThisSession;

  const handleVerifyLater = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }
    setDismissedThisSession(true);
  };

  const handleVerifyNow = () => {
    setDismissedThisSession(true);
    router.push('/pages/verify-phone');
  };

  return (
    <PhoneVerificationModal
      open={showModal}
      onVerifyLater={handleVerifyLater}
      onVerifyNow={handleVerifyNow}
    />
  );
}
