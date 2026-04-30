'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  subscribeUser,
  unsubscribeUser,
  type PushSubscriptionJSON,
} from '../../push/actions';

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

/**
 * Aggressively ensures a healthy SW registration by:
 * 1. Purging any zombie registrations (no active worker / unknown script)
 * 2. Waiting for Chrome to finish cleanup
 * 3. Registering /sw.js fresh
 * 4. Waiting for the worker to reach "activated" state
 */
async function ensureActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  // Step 1: Purge zombies
  const all = await navigator.serviceWorker.getRegistrations();
  for (const reg of all) {
    if (!reg.active || reg.active.scriptURL === '') {
      await reg.unregister();
    }
  }

  // Step 2: Check for a healthy existing registration
  let reg = await navigator.serviceWorker.getRegistration('/');
  if (reg?.active) return reg;

  // Step 3: If still no healthy registration, register fresh
  await new Promise((r) => setTimeout(r, 100));
  try {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }

  if (reg.active) return reg;

  // Step 4: Wait for activation (up to 6s)
  const worker = reg.installing ?? reg.waiting;
  if (!worker) return null;

  await new Promise<void>((resolve) => {
    if (worker.state === 'activated') { resolve(); return; }
    const onChange = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', onChange);
        resolve();
      }
    };
    worker.addEventListener('statechange', onChange);
    setTimeout(() => {
      worker.removeEventListener('statechange', onChange);
      resolve();
    }, 6000);
  });

  const final = await navigator.serviceWorker.getRegistration('/');
  return final?.active ? final : null;
}

export default function AccountNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    if (!supported) return;
    setIsSupported(true);

    (async () => {
      try {
        const reg = await ensureActiveRegistration();
        if (!reg || !mounted.current) return;
        const existing = await reg.pushManager.getSubscription();
        if (existing && mounted.current) setIsSubscribed(true);
      } catch { /* ignore */ }
    })();
  }, []);

  async function handleToggle() {
    if (!isSupported || loading) return;
    if (isSubscribed) {
      await handleUnsubscribe();
    } else {
      await handleSubscribe();
    }
  }

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notifications are blocked in your browser settings.');
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError('Push notifications are not configured on the server.');
        return;
      }

      const reg = await ensureActiveRegistration();
      if (!reg) {
        setError('Service worker could not activate. Try refreshing the page.');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const serialized = JSON.parse(JSON.stringify(sub)) as PushSubscriptionJSON;
      const result = await subscribeUser(serialized);
      if (!result?.success) {
        setError(result?.error ?? 'Failed to save subscription.');
        await sub.unsubscribe().catch(() => {});
        return;
      }

      setIsSubscribed(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError('Failed to subscribe.' + (msg ? ` (${msg})` : ''));
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (reg) {
        const existing = await reg.pushManager.getSubscription();
        await existing?.unsubscribe();
      }
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
      <div className="acct-notif">
        <div className="acct-notif__label">
          <Image
            src="/assets/account-page-notification-icon.png"
            alt=""
            width={18}
            height={18}
            className="acct-notif__label-icon"
          />
          Alert Preferences
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Push notifications are not supported on this device.
        </p>
      </div>
    );
  }

  return (
    <div className="acct-notif">
      <div className="acct-notif__label">
        <Image
          src="/assets/account-page-notification-icon.png"
          alt=""
          width={18}
          height={18}
          className="acct-notif__label-icon"
        />
        Alert Preferences
      </div>

      <div className="acct-notif__row">
        <div className="acct-notif__text">
          <strong>Push Notifications</strong>
          <span>Get instant community safety alerts</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isSubscribed}
          disabled={loading}
          className={`acct-toggle${isSubscribed ? ' acct-toggle--on' : ''}`}
          onClick={handleToggle}
        >
          <span className="acct-toggle__knob" />
        </button>
      </div>

      {error && <p className="acct-notif__error">{error}</p>}
    </div>
  );
}
