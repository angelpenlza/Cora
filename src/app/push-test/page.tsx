'use client';

import { useEffect, useState } from 'react';
import { subscribeUser, unsubscribeUser, sendNotification, type PushSubscriptionJSON } from '../push/actions';

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

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(null);
  const [message, setMessage] = useState('');

  async function hydrateExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const serialized = JSON.parse(JSON.stringify(existing)) as PushSubscriptionJSON;
        setSubscription(serialized);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSupported(true);
      void hydrateExistingSubscription();
    }
  }, []);

  async function subscribeToPush() {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const serialized = JSON.parse(JSON.stringify(sub)) as PushSubscriptionJSON;
    setSubscription(serialized);
    await subscribeUser(serialized);
  }

  async function unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      await existing?.unsubscribe();
    } catch {
      // ignore
    }
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return;
    await sendNotification(message.trim());
    setMessage('');
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '1.5rem', borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Push Notifications</h2>
      {subscription ? (
        <>
          <p style={{ marginBottom: '0.75rem' }}>You are subscribed to push notifications.</p>
          <button
            type="button"
            onClick={unsubscribeFromPush}
            style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ef4444', color: '#ef4444', background: 'white' }}
          >
            Unsubscribe
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <button
              type="button"
              onClick={sendTestNotification}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#111827', color: 'white' }}
            >
              Send Test
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ marginBottom: '0.75rem' }}>You are not subscribed to push notifications.</p>
          <button
            type="button"
            onClick={subscribeToPush}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#111827', color: 'white' }}
          >
            Subscribe
          </button>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <PushNotificationManager />;
}

