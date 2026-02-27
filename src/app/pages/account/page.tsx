import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NotificationToggle from '@/app/components/notification-toggle';

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