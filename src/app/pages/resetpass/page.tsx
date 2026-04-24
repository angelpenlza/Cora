'use client';

import '@/app/styles/reset-password.css';
import { resetpass } from '@/app/components/actions';
import { useSearchParams } from 'next/navigation';
import { Err } from '@/app/components/client-components';
import Link from 'next/link';
import Image from 'next/image';

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Complete password reset after email link (Supabase recovery `code`).
 * Figma: same hero, new password + confirm, Submit, return home.
 */
export default function ResetPass() {
  const searchParams = useSearchParams();
  const err = searchParams.get('err');
  const code = searchParams.get('code') ?? '';

  return (
    <div className="reset-pw-page">
      <div className="reset-pw-card">
        <div className="reset-pw-hero">
          <Image
            src="/assets/reset-password-image.png"
            alt=""
            width={440}
            height={250}
            sizes="(max-width: 480px) 52vw, 220px"
            priority
            style={{ width: '100%', height: 'auto' }}
          />
        </div>

        <h1 className="reset-pw-title">Reset Password</h1>
        <p className="reset-pw-lead">
          We have received your request! You are now able to assign yourself a new
          password.
        </p>

        {err ? <Err message={safeDecode(err)} /> : null}

        {!code ? (
          <p className="reset-pw-banner reset-pw-banner--error" role="alert">
            This link is missing a reset code. Open the link from your latest reset
            email, or{' '}
            <Link href="/pages/forgotpass" className="reset-pw-inline-link">
              request a new reset
            </Link>
            .
          </p>
        ) : null}

        <form className="reset-pw-form">
          <input type="hidden" name="code" value={code} />

          <label htmlFor="reset-pw-new" className="reset-pw-label">
            New Password
          </label>
          <input
            id="reset-pw-new"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="reset-pw-input"
            placeholder="••••••••"
          />

          <label htmlFor="reset-pw-confirm" className="reset-pw-label">
            Confirm New Password
          </label>
          <input
            id="reset-pw-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="reset-pw-input"
            placeholder="••••••••"
          />

          <div className="reset-pw-actions">
            <button
              type="submit"
              formAction={resetpass}
              className="reset-pw-btn"
              disabled={!code}
            >
              Submit
            </button>
          </div>
        </form>

        <div className="reset-pw-footer">
          <Link href="/" className="reset-pw-home-link">
            ← return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
