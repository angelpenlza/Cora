'use server';

import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails('mailto:novaocc1@gmail.com', publicKey, privateKey);
}

/** Base URL for notification assets (icon, badge). Must be absolute for iOS/Android to load correctly. */
function getNotificationBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

type SerializedSubscription = {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export type PushSubscriptionJSON = SerializedSubscription;

export async function subscribeUser(sub: PushSubscriptionJSON) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { endpoint, keys } = sub;

  if (!endpoint) {
    return { success: false, error: 'Invalid subscription: missing endpoint' };
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys?.p256dh ?? null,
        auth: keys?.auth ?? null,
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    console.error('Error saving push subscription', error);
    return { success: false, error: 'Failed to save subscription' };
  }

  return { success: true };
}

export async function unsubscribeUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting push subscription', error);
    return { success: false, error: 'Failed to unsubscribe' };
  }

  return { success: true };
}

export async function sendNotification(message: string) {
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured on the server');
  }

  if (!adminClient) {
    console.error('Supabase admin client is not configured');
    return { success: false, error: 'Server push configuration is missing' };
  }

  const supabase = adminClient;

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth');

  if (error) {
    console.error('Error loading push subscriptions', error);
    return { success: false, error: 'Failed to load subscriptions' };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: false, error: 'No subscriptions available' };
  }

  const base = getNotificationBaseUrl();
  const iconUrl = `${base}/assets/web-app-manifest-192x192.png`;
  const badgeUrl = `${base}/assets/badge-72x72.png`;
  const payload = JSON.stringify({
    title: 'Cora Notification',
    body: message,
    icon: iconUrl,
    badge: badgeUrl,
  });

  // #region agent log (prod: check Vercel/host function logs for [DEBUG-BADGE])
  const debugPayload = { base, iconUrl, badgeUrl, payloadPreview: payload.substring(0, 280) };
  console.log('[DEBUG-BADGE] push payload', JSON.stringify(debugPayload));
  fetch('http://127.0.0.1:7619/ingest/b840f1ee-ac9c-402c-a851-53805b34e6d1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '281cae' },
    body: JSON.stringify({
      sessionId: '281cae',
      runId: 'sendNotification',
      hypothesisId: 'H1-H2',
      location: 'push/actions.ts:payload',
      message: 'Push payload built',
      data: debugPayload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  for (const sub of subscriptions) {
    const pushSubscription: PushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
    } catch (err: any) {
      console.error('Error sending push notification:', err);

      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id);
      }
    }
  }

  return { success: true };
}

export async function sendNewReportNotification(title: string) {
  const message = `New report: ${title}`;
  return sendNotification(message);
}
