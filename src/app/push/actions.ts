'use server';

import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails('mailto:novaocc1@gmail.com', publicKey, privateKey);
}

export type PushSubscriptionJSON = PushSubscription;

let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscriptionJSON) {
  subscription = sub;
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error('No subscription available');
  }

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured on the server');
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Cora Notification',
        body: message,
        icon: '/assets/web-app-manifest-192x192.png',
      }),
    );
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

