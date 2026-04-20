import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NotificationToggle from '@/app/components/notification-toggle';
import VerifiedToast from '@/app/components/verified-toast';
import { Reports } from '@/app/components/client-components';
import { UpdateAccount } from './account';
import { getImages } from '@/app/components/cfhelpers';
import { buildPublicR2Url, isPresignedUrl } from '@/lib/presigned-url';

/**
 * Account page (authenticated).
 *
 * - Requires an authenticated Supabase user; otherwise redirects to login.
 * - Looks up the user's profile to display a friendly greeting.
 * - Embeds the `NotificationToggle` to manage browser push notifications.
 */
export default async function Account() {
  const images = await getImages();
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();
  if (!user) redirect('/pages/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Stop using expiring presigned avatar URLs; rebuild a stable public URL from avatar_name when possible.
  if (profile && typeof profile.avatar_url === 'string' && isPresignedUrl(profile.avatar_url)) {
    const rebuilt = buildPublicR2Url(process.env.NEXT_PUBLIC_R2_PUBLIC_AVATAR_URL, profile.avatar_name);
    profile.avatar_url = rebuilt;
  }

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('created_by', user?.id)

  const username =
    profile?.username ??
    (user.user_metadata as { username?: string } | null)?.username ??
    user.email?.split('@')[0] ??
    'there';

  return (
    <div className="account-container">
      <VerifiedToast />
      <h1>Welcome, {username}!!!</h1>
      <NotificationToggle />
      <h3>Your Reports</h3>
      <Reports reports={report} images={images} inAccount={true}/>
      <UpdateAccount user={profile} />
    </div>
  );
}