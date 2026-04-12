'use client';

import Image from 'next/image';

export type PhoneVerificationModalProps = {
  open: boolean;
  /**
   * `phone` — logged-in user needs phone verification (default).
   * `signIn` — guest needs to sign in (same layout/styles; used on upload).
   */
  variant?: 'phone' | 'signIn';
  /** Left / secondary action (e.g. Authorize Later, Not now). */
  onVerifyLater?: () => void;
  /** Right / primary action (e.g. Authorize Now, Sign in). */
  onVerifyNow?: () => void;
};

export default function PhoneVerificationModal({
  open,
  variant = 'phone',
  onVerifyLater,
  onVerifyNow,
}: PhoneVerificationModalProps) {
  if (!open) return null;

  const isSignIn = variant === 'signIn';
  const titleId = isSignIn ? 'sign-in-gate-title' : 'phone-verification-title';

  const title = isSignIn
    ? 'Reminder: You must be signed in to an authorized account to interact with user reports'
    : 'Reminder: You must be authorized to create a report';

  const body = isSignIn
    ? 'Sorry, you must be signed in to submit reports, vote, comment, and use other interactive features. Sign in with your email or Google, or go back to browse without signing in.'
    : 'Your account has not enabled authorization yet. Authorize your account in order to submit reports and interact with other user reports.';

  const secondaryLabel = isSignIn ? 'Not now' : 'Authorize Later';
  const primaryLabel = isSignIn ? 'Sign in' : 'Authorize Now';

  return (
    <div
      className="phone-verification-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="phone-verification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="phone-verification-top-accent" aria-hidden />
        <div className="phone-verification-content">
          <div className="phone-verification-header">
            <Image
              src="/assets/modal-lock.png"
              alt=""
              width={40}
              height={40}
              className="phone-verification-lock"
              unoptimized
            />
            <h2 id={titleId} className="phone-verification-title">
              {title}
            </h2>
          </div>

          <div className="phone-verification-divider" />

          <p className="phone-verification-body">{body}</p>

          <div className="phone-verification-actions">
            <button
              type="button"
              onClick={onVerifyLater}
              className="phone-verification-button phone-verification-button--secondary"
            >
              {secondaryLabel}
            </button>
            <button
              type="button"
              onClick={onVerifyNow}
              className="phone-verification-button phone-verification-button--primary"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
