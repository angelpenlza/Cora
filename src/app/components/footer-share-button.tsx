'use client';

import Image from 'next/image';
import { useCallback } from 'react';

type FooterShareButtonProps = {
  /** Canonical site origin (e.g. https://example.com) for share / clipboard fallback. */
  siteOrigin: string;
};

/**
 * Uses Web Share API when available; otherwise copies the site URL to the clipboard.
 */
export default function FooterShareButton({ siteOrigin }: FooterShareButtonProps) {
  const handleClick = useCallback(async () => {
    const url =
      (typeof window !== 'undefined' ? window.location.origin : '') || siteOrigin;
    const shareUrl = url.replace(/\/$/, '') || 'https://';
    const title = 'Cora — community safety for Orange County';

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url: `${shareUrl}/` });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareUrl}/`);
      }
    } catch {
      /* user cancelled share or clipboard denied */
    }
  }, [siteOrigin]);

  return (
    <button
      type="button"
      className="site-footer-social-btn"
      aria-label="Share Cora"
      onClick={() => void handleClick()}
    >
      <Image
        src="/assets/footer-share-bubble.png"
        alt=""
        width={40}
        height={40}
        className="site-footer-social-img"
        unoptimized
      />
    </button>
  );
}
