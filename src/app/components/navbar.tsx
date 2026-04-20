'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { signout } from './actions';
import { isPresignedUrl } from '@/lib/presigned-url';

const MAP_HREF = '/pages/interactive-map';
const REPORTS_HREF = '/pages/reports';
const RESOURCES_HREF = '/pages/resources';
const UPLOAD_HREF = '/pages/upload';
const LOGIN_HREF = '/pages/login';
const ACCOUNT_HREF = '/pages/account';
const PERSON_GLYPH_FILL = '#F27F0D';
const DEFAULT_AVATAR_URL =
  'https://pub-2cb33e70d73b4e729e9246e178904e40.r2.dev/default-pfp.png';

/** First non-empty avatar URL from Supabase / OAuth metadata, or null. */
function readAvatarUrlFromMeta(
  meta: Record<string, unknown> | undefined,
): string | null {
  if (!meta) return null;
  for (const key of ['avatar_url', 'picture'] as const) {
    const v = meta[key];
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (!t || t === 'null' || t === 'undefined') continue;
    return t;
  }
  return null;
}

/** `profiles.avatar_url` wins over JWT metadata (uploaded avatar lives on profile). */
function readPreferredAvatarUrl(
  profileAvatarUrl: string | null | undefined,
  meta: Record<string, unknown> | undefined,
): string | null {
  if (typeof profileAvatarUrl === 'string') {
    const t = profileAvatarUrl.trim();
    if (t && t !== 'null' && t !== 'undefined') {
      // Legacy default shipped from /public; migrate display to R2 default.
      if (t === '/assets/user.png') return DEFAULT_AVATAR_URL;
      // Do not render expiring presigned URLs; fall back to default.
      if (isPresignedUrl(t)) return null;
      return t;
    }
  }
  return readAvatarUrlFromMeta(meta);
}

/** Filled person silhouette (avatar fallback + Account menu). */
function PersonGlyphIcon({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill={PERSON_GLYPH_FILL}
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      />
    </svg>
  );
}

/** True when `pathname` is exactly `href` or a nested route (e.g. `/pages/reports/12`). */
function navHrefActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function CoraLogoLink() {
  // unoptimized: default Image pipeline resizes/compresses; that softens line-art logos.
  return (
    <Link href="/" className="cora-logo-link" aria-label="Cora home">
      <Image
        src="/assets/cora-logo.png"
        alt="Cora"
        width={200}
        height={56}
        className="cora-logo-img"
        priority
        unoptimized
      />
    </Link>
  );
}

function NavLinks({
  pathname,
  className,
  linkClassName,
  onNavigate,
}: {
  pathname: string | null;
  className?: string;
  linkClassName: string;
  onNavigate?: () => void;
}) {
  const itemClass = (href: string) =>
    `${linkClassName}${navHrefActive(pathname, href) ? ' is-active' : ''}`;

  return (
    <nav className={className} aria-label="Primary">
      <Link
        href={MAP_HREF}
        className={itemClass(MAP_HREF)}
        onClick={onNavigate}
        aria-current={navHrefActive(pathname, MAP_HREF) ? 'page' : undefined}
      >
        Explore Map
      </Link>
      <Link
        href={REPORTS_HREF}
        className={itemClass(REPORTS_HREF)}
        onClick={onNavigate}
        aria-current={navHrefActive(pathname, REPORTS_HREF) ? 'page' : undefined}
      >
        Reports
      </Link>
      <Link
        href={RESOURCES_HREF}
        className={itemClass(RESOURCES_HREF)}
        onClick={onNavigate}
        aria-current={navHrefActive(pathname, RESOURCES_HREF) ? 'page' : undefined}
      >
        Resources
      </Link>
    </nav>
  );
}

function AccountMenuIcon() {
  return <PersonGlyphIcon size={20} className="site-header-account-menu-icon" />;
}

function LogOutMenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function displayName(user: User) {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    '';
  if (full.trim()) return full.trim();
  if (user.email) return user.email.split('@')[0] ?? 'User';
  return 'User';
}

function UserAvatarButton({
  user,
  profileAvatarUrl,
  open,
  onToggle,
  btnRef,
}: {
  user: User;
  profileAvatarUrl?: string | null;
  open: boolean;
  onToggle: () => void;
  btnRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const preferred = readPreferredAvatarUrl(profileAvatarUrl, meta);
  const avatarSrc = preferred || DEFAULT_AVATAR_URL;
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
  }, [preferred, user.id]);

  const showRemote = Boolean(avatarSrc) && !remoteFailed;

  return (
    <button
      ref={btnRef}
      type="button"
      className="site-header-avatar-btn"
      aria-expanded={open}
      aria-haspopup="true"
      aria-label="Account menu"
      onClick={onToggle}
    >
      {showRemote ? (
        // Native <img>: avatar URLs may use R2 public domains (e.g. *.r2.dev) that are not
        // in next/image remotePatterns; Next/Image would fail and force the glyph fallback.
        <img
          src={avatarSrc}
          alt=""
          width={40}
          height={40}
          className="cora-user-avatar-photo"
          referrerPolicy="no-referrer"
          onError={() => setRemoteFailed(true)}
        />
      ) : (
        <PersonGlyphIcon size={22} />
      )}
    </button>
  );
}

function UserMenu({
  user,
  profileAvatarUrl,
}: {
  user: User;
  profileAvatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const confirmSignout = () => {
    if (window.confirm('Log out?')) signout();
  };

  return (
    <div className="site-header-user-wrap" ref={wrapRef}>
      <UserAvatarButton
        user={user}
        profileAvatarUrl={profileAvatarUrl}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        btnRef={btnRef}
      />
      {open && (
        <div className="site-header-user-dropdown" role="menu">
          <div className="site-header-user-name">{displayName(user)}</div>
          <Link
            href={ACCOUNT_HREF}
            className="site-header-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <AccountMenuIcon />
            Account
          </Link>
          <button
            type="button"
            className="site-header-dropdown-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              confirmSignout();
            }}
          >
            <LogOutMenuIcon />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default function NavBar({
  user,
  profileAvatarUrl,
}: {
  user: User | null;
  /** From `profiles.avatar_url` (layout); takes precedence over OAuth-only JWT metadata. */
  profileAvatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button
          type="button"
          className="site-header-menu-btn"
          aria-expanded={drawerOpen}
          aria-controls="site-header-drawer"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          <span className="site-header-menu-icon" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="site-header-logo-cell">
          <CoraLogoLink />
        </div>

        <NavLinks
          pathname={pathname}
          className="site-header-nav-desktop"
          linkClassName="site-header-nav-link"
        />

        <div className="site-header-end">
          <Link
            href={UPLOAD_HREF}
            className={`site-header-btn-report${navHrefActive(pathname, UPLOAD_HREF) ? ' is-active' : ''}`}
            aria-current={navHrefActive(pathname, UPLOAD_HREF) ? 'page' : undefined}
          >
            Make a Report
          </Link>
          {user ? (
            <UserMenu user={user} profileAvatarUrl={profileAvatarUrl} />
          ) : (
            <Link
              href={LOGIN_HREF}
              className={`site-header-signin${navHrefActive(pathname, LOGIN_HREF) ? ' is-active' : ''}`}
              aria-current={navHrefActive(pathname, LOGIN_HREF) ? 'page' : undefined}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div
        id="site-header-drawer"
        className={`site-header-drawer${drawerOpen ? ' is-open' : ''}`}
        aria-hidden={!drawerOpen}
      >
        <div className="site-header-drawer-inner">
          <NavLinks
            pathname={pathname}
            linkClassName="site-header-drawer-link"
            onNavigate={closeDrawer}
          />
          <Link
            href={UPLOAD_HREF}
            className={`site-header-btn-report${navHrefActive(pathname, UPLOAD_HREF) ? ' is-active' : ''}`}
            onClick={closeDrawer}
            aria-current={navHrefActive(pathname, UPLOAD_HREF) ? 'page' : undefined}
          >
            Make a Report
          </Link>
        </div>
      </div>
    </header>
  );
}
