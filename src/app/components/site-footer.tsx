import Image from 'next/image';
import Link from 'next/link';
import FooterMailLink from './footer-mail-link';
import FooterShareButton from './footer-share-button';

const MAP_HREF = '/pages/interactive-map';
const REPORTS_HREF = '/pages/reports';
const RESOURCES_HREF = '/pages/resources';

/** External docs (question-mark in footer). `Link` + absolute URLs can hydrate oddly; use `<a>`. */
const DOCS_HREF =
  process.env.NEXT_PUBLIC_DOCS_URL?.trim() ||
  'https://cora-59c313ca.mintlify.app/';

const DEFAULT_CONTACT_EMAIL = 'corafyi@gmail.com';

type SiteFooterProps = {
  /** Used for share / clipboard when the Web Share API is unavailable. */
  siteOrigin: string;
  /** Overrides default inbox for the mail bubble (Gmail compose + subject “Cora”). */
  contactEmail?: string;
};

export default function SiteFooter({
  siteOrigin,
  contactEmail,
}: SiteFooterProps) {
  const email = contactEmail?.trim() || DEFAULT_CONTACT_EMAIL;

  const copyright = '© 2026 Cora Safety Systems Inc. All rights reserved.';

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">

        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link href="/" className="site-footer-logo-link" aria-label="Cora home">
              <Image
                src="/assets/cora-logo-light.png"
                alt=""
                width={180}
                height={50}
                className="site-footer-logo-img"
                unoptimized
              />
            </Link>
            <p className="site-footer-tagline">
              Safety-first community platform for Orange County residents. Built by locals, for
              locals.
            </p>
          </div>

          <div className="site-footer-nav-cluster">
            <nav className="site-footer-col" aria-label="Platform">
              <h3 className="site-footer-heading">Platform</h3>
              <ul className="site-footer-links">
                <li>
                  <Link href={MAP_HREF}>Explore Map</Link>
                </li>
                <li>
                  <Link href={REPORTS_HREF}>Reports</Link>
                </li>
                <li>
                  <Link href={RESOURCES_HREF}>Resources</Link>
                </li>
              </ul>
            </nav>

            <nav className="site-footer-col" aria-label="Community">
              <h3 className="site-footer-heading">Community</h3>
              <ul className="site-footer-links">
                <li>
                  <Link href="/pages/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/pages/terms">Terms</Link>
                </li>
                <li>
                  <Link href="/pages/help">Help</Link>
                </li>
              </ul>
            </nav>

            <div className="site-footer-connect">
              <h3 className="site-footer-heading">Connect</h3>
              <div className="site-footer-social-row">
                <FooterShareButton siteOrigin={siteOrigin} />
                <FooterMailLink email={email} />
                <a
                  href={DOCS_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-social-btn"
                  aria-label="Documentation (opens in new tab)"
                >
                  <Image
                    src="/assets/footer-question-bubble.png"
                    alt=""
                    width={40}
                    height={40}
                    className="site-footer-social-img"
                    unoptimized
                  />
                </a>
              </div>
              <p className="site-footer-copy site-footer-copy--connect">{copyright}</p>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy site-footer-copy--mobile-bar">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
