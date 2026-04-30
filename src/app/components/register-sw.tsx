'use client';

import { useEffect } from 'react';

/**
 * Client-only component that manages the service worker (`/sw.js`).
 *
 * Registers the SW in all environments — it's required for push
 * notifications and offline caching. In development, the SW's
 * fetch handler already uses network-first for pages and
 * network-only for API routes, so registration is safe.
 */
export default function RegisterSw() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.update();
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              console.log('SW updated — new cache version active');
            }
          });
        });
      })
      .catch((err) => console.error('SW registration failed', err));
  }, []);
  return null;
}
