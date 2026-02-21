'use client';

import { useEffect } from 'react';

export default function DebugViewportLogger() {
  useEffect(() => {
    const w = typeof window === 'undefined' ? 0 : window.screen?.width ?? 0;
    const h = typeof window === 'undefined' ? 0 : window.screen?.height ?? 0;
    const dpr = typeof window === 'undefined' ? 0 : window.devicePixelRatio ?? 0;
    const links = typeof document === 'undefined' ? [] : Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-startup-image"]'));
    const splashMedia = links.map((el) => el.media || '');
    const splashHrefs = links.map((el) => el.href || el.getAttribute('href') || '');
    const has440 = splashMedia.some((m) => m.includes('440px'));
    const first440Idx = splashMedia.findIndex((m) => m.includes('440px'));
    const first440Href = first440Idx >= 0 ? splashHrefs[first440Idx] ?? '' : '';
    const standalone = typeof navigator !== 'undefined' && !!(navigator as { standalone?: boolean }).standalone;
    const metaCapable = typeof document !== 'undefined' ? document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content') ?? '' : '';
    const splashDebug = typeof document !== 'undefined' ? document.querySelector('meta[name="splash-debug"]')?.getAttribute('content') ?? '' : '';

    const report = (imageStatus?: number, imageLen?: number) => {
      const params = new URLSearchParams({
        width: String(w),
        height: String(h),
        dpr: String(dpr),
        has440: has440 ? '1' : '0',
        splashMedia: JSON.stringify(splashMedia.slice(0, 5)),
        splashHrefs: JSON.stringify(splashHrefs.slice(0, 4)),
        first440Href,
        standalone: standalone ? '1' : '0',
        metaCapable,
        splashDebug,
        ...(imageStatus !== undefined && { imageStatus: String(imageStatus) }),
        ...(imageLen !== undefined && { imageLen: String(imageLen) }),
      });
      fetch(`/api/debug-viewport?${params.toString()}`).catch(() => {});
    };

    report();

    if (first440Href) {
      fetch(first440Href, { method: 'HEAD' })
        .then((r) => report(r.status, parseInt(r.headers.get('content-length') ?? '0', 10) || undefined))
        .catch(() => report(-1));
    }
  }, []);
  return null;
}
