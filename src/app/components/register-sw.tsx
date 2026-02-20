'use client';

import { useEffect } from 'react';

export default function RegisterSw() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }
  }, []);
  return null;
}
