'use client';

import Script from 'next/script';
import { memo, useCallback, useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (
    container: HTMLElement | string,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact' | 'flexible';
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile loaded with explicit `render()` so the widget appears on
 * client-side navigations (Next dedupes the script; implicit `.cf-turnstile`
 * only runs on the script’s first load). Wrapped in `memo` so frequent parent
 * state updates (e.g. signup password fields) do not reconcile away the iframe.
 */
type TurnstileFieldProps = {
  /** Widget footprint; `flexible` stretches to the container width (e.g. full-width forms). */
  size?: 'normal' | 'compact' | 'flexible';
};

function TurnstileField({ size = 'normal' }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  const mountWidget = useCallback(() => {
    const el = containerRef.current;
    if (!el || !siteKey || !window.turnstile) return;
    if (widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(el, {
      sitekey: siteKey,
      theme: 'light',
      size,
    });
  }, [siteKey, size]);

  useEffect(() => {
    mountWidget();
    return () => {
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
    };
  }, [mountWidget]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={mountWidget}
      />
      <div ref={containerRef} className="turnstile-field-root" />
    </>
  );
}

export default memo(TurnstileField);
