'use client';

import { useEffect } from 'react';

/**
 * Client-only component that registers the service worker (`/sw.js`).
 *
 * Mounted once in the root layout so that:
 * - PWA install banners become available where supported.
 * - Web Push subscriptions can be created from client components.
 *
 * Registration is:
 * - Gated behind `window.isSecureContext` (HTTPS or localhost).
 * - No-op if `serviceWorker` is not supported in the current browser.
 */
export default function RegisterSw() {
  useEffect(() => {
    if (
      window.isSecureContext &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
  .register('/sw.js', { scope: '/' })
  .then(reg => console.log('SW registered', reg))
  .catch(err => console.error('SW registration failed', err));    }
  }, []);
  return null;
}
