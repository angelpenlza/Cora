'use client';

import { useEffect, useState } from 'react';
import {
  subscribeUser,
  unsubscribeUser,
  type PushSubscriptionJSON,
} from '../push/actions';

/**
 * Convert a URL-safe base64 string (VAPID public key) to a `Uint8Array`.
 *
 * The Push API expects `applicationServerKey` as binary data instead of a string.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if a push subscription already exists for this service worker
   * registration and hydrate local state accordingly.
   */
  async function hydrateExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setIsSubscribed(true);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      if (!('serviceWorker' in navigator)) console.warn('No serviceWorker support');
      if (!('PushManager' in window)) console.warn('No PushManager support');
      if (!('Notification' in window)) console.warn('No Notification API');
      void hydrateExistingSubscription();
    }
  }, []);

  /**
   * Request browser permission, create a new PushSubscription, and persist it
   * via the `subscribeUser` server action.
   */
  async function handleSubscribe() {
    if (!isSupported || loading) return;

    setLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notifications are blocked in your browser settings.');
        setLoading(false);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError('Push notifications are not configured on the server.');
        setLoading(false);
        return;
      }
      // check if service worker is enabled & push manager is supported by browser, .subscribe() creates a subscription object
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      // serialize the subscription object to a JSON string and save to database
      const serialized = JSON.parse(JSON.stringify(sub)) as PushSubscriptionJSON;
      // save the subscription to the database
      const result = await subscribeUser(serialized);

      if (!result?.success) {
        setError(result?.error ?? 'Failed to save subscription.');
        await sub.unsubscribe().catch(() => {});
        setLoading(false);
        return;
      }

      setIsSubscribed(true);
    } catch (err: any) {
      const fallbackMessage = 'Failed to subscribe to notifications.';
      const msg = err && (err as Error).message ? (err as Error).message : '';
      const extra = msg
        ? msg.includes('User denied push permission')
          ? ' Open Settings → Notifications, find Cora, and allow notifications, then try again.'
          : ` (${msg})`
        : '';
      setError(fallbackMessage + extra);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Unsubscribe the existing PushSubscription (if any) and remove the
   * server-side record via `unsubscribeUser`.
   */
  async function handleUnsubscribe() {
    if (!isSupported || loading) return;

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      await existing?.unsubscribe();
      const result = await unsubscribeUser();
      if (!result?.success) {
        setError(result?.error ?? 'Failed to unsubscribe.');
      } else {
        setIsSubscribed(false);
      }
    } catch {
      setError('Failed to unsubscribe from notifications.');
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
        Browser push notifications are not supported on this device or browser.
      </div>
    );
  }
// this is the notification UI toggle component that allows the user to enable or disable push notifications everything above is the client side logic
  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '1rem 1.25rem',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        maxWidth: 480,
      }}
    >
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Push notifications
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.75rem' }}>
        Get a browser notification when new reports are posted on Cora.
      </p>
      {error ? (
        <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
      >
        {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
      </button>
    </div>
  );
}

