import { createClient } from '@/lib/supabase/server';
import '@/app/styles/account.css';
import { redirect } from 'next/navigation';
import VerifiedToast from '@/app/components/verified-toast';
import { Reports } from '@/app/components/client-components';
import { AccountCard } from './account';
import { getImages } from '@/app/components/cfhelpers';
import { resolveProfileAvatarUrl } from '@/lib/avatar-url';
import Link from 'next/link';

export default async function Account() {
  const images = await getImages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/pages/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    profile.avatar_url = resolveProfileAvatarUrl({
      avatarUrl: profile.avatar_url,
      avatarName: profile.avatar_name,
      publicBase: process.env.NEXT_PUBLIC_R2_PUBLIC_AVATAR_URL,
    });
  }

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('created_by', user?.id);

  const displayName =
    profile?.full_name ??
    profile?.username ??
    (user.user_metadata as { username?: string } | null)?.username ??
    user.email?.split('@')[0] ??
    'User';

  return (
    <div className="acct-page">
      <VerifiedToast />

      <Link href="/" className="acct-back-link">
        ← Go back
      </Link>

      <AccountCard 
        profile={profile} 
        displayName={displayName} 
        email={user?.email!}
      />

      <div className="acct-reports">
        <h2 className="acct-reports__title">Your Reports</h2>
        <Reports reports={report} images={images} inAccount={true} />
      </div>
    </div>
  );
}
