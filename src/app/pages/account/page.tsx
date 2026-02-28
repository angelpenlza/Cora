import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NotificationToggle from '@/app/components/notification-toggle';

/**
 * Account page (authenticated).
 *
 * - Requires an authenticated Supabase user; otherwise redirects to login.
 * - Looks up the user's profile to display a friendly greeting.
 * - Embeds the `NotificationToggle` to manage browser push notifications.
 */
export default async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/pages/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = profile?.username ?? 'there';

  return (
    <div className="account-container">
      <h1>Welcome, {username}!!!</h1>
      <NotificationToggle />
    </div>
  );
}