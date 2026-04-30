'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker (`/sw.js`) for push notifications and caching.
 *
 * Handles "zombie" registrations: previous deployments unregistered the SW,
 * leaving Chrome with broken entries that prevent re-registration. This
 * component purges all existing registrations first, then registers cleanly.
 */
export default function RegisterSw() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

    (async () => {
      try {
        const all = await navigator.serviceWorker.getRegistrations();
        for (const reg of all) {
          if (!reg.active || reg.active.scriptURL === '') {
            await reg.unregister();
          }
        }

        await new Promise((r) => setTimeout(r, 100));

        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              console.log('SW updated — new cache version active');
            }
          });
        });
      } catch (err) {
        console.error('SW registration failed:', err);
      }
    })();
  }, []);
  return null;
}
