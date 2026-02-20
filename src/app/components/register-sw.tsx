'use client';

import { useEffect } from 'react';

export default function RegisterSw() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {});
    }
  }, []);
  return null;
}
