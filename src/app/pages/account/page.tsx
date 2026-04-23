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
    <div className="account-page">

      <VerifiedToast />

    {/* Go back button */}
      <div className="account-page__back">
        <a href="/" className="account-page__back-btn">
          ← Go back
        </a>
      </div>

    {/* MAIN CARD */}
      <div className="account-page__card">

        <h2 className="account-page__title">Account Details</h2>
        <p className="account-page__subtitle">
          Update your profile information and notification preference.
        </p>

      {/* Avatar section */}
        <div className="account-page__profile">
          <div className="account-page__avatar-wrapper">
            <div className="account-page__avatar" />
          </div>
          <h3 className="account-page__username">
            {username}
          </h3>
        </div>

      {/* Username update */}
        <div className="account-page__section">
          <label className="account-page__label">Username</label>
          <div className="account-page__input-row">
            <UpdateAccount user={profile} />
          </div>
        </div>

      {/* Alert preferences */}
        <div className="account-page__section">
          <label className="account-page__label">Alert Preferences</label>

          <div className="account-page__toggle">
            <div className="account-page__toggle-text">
              <span className="account-page__toggle-title">
                Push Notifications
              </span>
              <span className="account-page__toggle-subtitle">
                Get instant community safety alerts
              </span>
            </div>

            <NotificationToggle />
          </div>
        </div>

    {/* Sign out */}
        <div className="account-page__actions">
          <a href="/pages/login" className="account-page__signout">
            Sign Out
          </a>
        </div>
      </div>

    {/* Reports section */}
      <div className="account-page__reports">
        <h3 className="account-page__reports-title">Your Reports</h3>
        <Reports reports={report} images={images} inAccount={true} />
      </div>

    </div>
  );
}
