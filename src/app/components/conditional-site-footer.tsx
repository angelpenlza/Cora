'use client';

import { usePathname } from 'next/navigation';
import SiteFooter from './site-footer';

const HIDE_FOOTER_PREFIX = '/pages/interactive-map';

type ConditionalSiteFooterProps = {
  siteOrigin: string;
  contactEmail?: string;
};

/** Omits the global footer on full-viewport routes (e.g. explore map). */
export default function ConditionalSiteFooter({
  siteOrigin,
  contactEmail,
}: ConditionalSiteFooterProps) {
  const pathname = usePathname();
  if (pathname === HIDE_FOOTER_PREFIX || pathname?.startsWith(`${HIDE_FOOTER_PREFIX}/`)) {
    return null;
  }
  return (
    <SiteFooter siteOrigin={siteOrigin} contactEmail={contactEmail} />
  );
}
