import { createClient } from '@/lib/supabase/server';
import '@/app/styles/verify-phone.css';
import { redirect } from 'next/navigation';
import VerifyPhoneForm from './verify-phone-form';

/**
 * Dedicated page for phone verification (OTP flow).
 * Requires an authenticated user; redirects to login otherwise.
 */
export default async function VerifyPhonePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/pages/login');

  return <VerifyPhoneForm />;
}
