'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';
import { submitReportFlag } from '@/app/components/report-actions';
import {
  SIGN_IN_REQUIRED,
  VERIFICATION_REQUIRED,
} from '@/lib/report-auth-errors';
import {
  REPORT_FLAG_OTHER_MAX_LEN,
  REPORT_FLAG_REASONS,
} from '@/lib/report-flag-reasons';
import type { ReportFlagReasonCode } from '@/lib/report-flag-reasons';

type ReportFlagControlsProps = {
  reportId: number;
  user: User | null;
  phoneVerified: boolean;
};

type AuthGate = 'none' | 'signIn' | 'phone';

export default function ReportFlagControls({
  reportId,
  user,
  phoneVerified,
}: ReportFlagControlsProps) {
  const router = useRouter();
  const pathname = usePathname() || `/pages/reports/${reportId}`;
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState<ReportFlagReasonCode>('misinformation');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authGate, setAuthGate] = useState<AuthGate>('none');

  const resetForm = () => {
    setReason('misinformation');
    setDetails('');
    setFormError(null);
    setSuccess(false);
  };

  const openModal = () => {
    if (!user) {
      setAuthGate('signIn');
      return;
    }
    if (!phoneVerified) {
      setAuthGate('phone');
      return;
    }
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const result = await submitReportFlag(
      reportId,
      reason,
      reason === 'other' ? details : undefined
    );
    setSubmitting(false);

    if (result.error === SIGN_IN_REQUIRED) {
      setAuthGate('signIn');
      return;
    }
    if (result.error === VERIFICATION_REQUIRED) {
      setAuthGate('phone');
      return;
    }
    if (result.error) {
      setFormError(result.error);
      return;
    }

    setSuccess(true);
    router.refresh();
    window.setTimeout(() => {
      closeModal();
    }, 1800);
  };

  const loginHref = `/pages/login?next=${encodeURIComponent(pathname)}`;

  return (
    <>
      <PhoneVerificationModal
        open={authGate === 'signIn'}
        variant="signIn"
        onVerifyLater={() => setAuthGate('none')}
        onVerifyNow={() => router.push(loginHref)}
      />
      <PhoneVerificationModal
        open={authGate === 'phone'}
        onVerifyLater={() => {
          setAuthGate('none');
        }}
        onVerifyNow={() => {
          setAuthGate('none');
          router.push('/pages/verify-phone');
        }}
      />

      <div className="report-flag-actions">
        <button type="button" className="report-flag-open-btn" onClick={openModal}>
          Report
        </button>
      </div>

      {modalOpen && (
        <div
          className="report-flag-overlay"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="report-flag-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-flag-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="report-flag-header">
              <h2 id="report-flag-title" className="report-flag-title">
                Report this post
              </h2>
              <button
                type="button"
                className="report-flag-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="report-flag-intro">
              Tell us what is wrong. Your report is sent to our team for review.
            </p>

            {success ? (
              <p className="report-flag-success" role="status">
                Thanks — your report was submitted.
              </p>
            ) : (
              <form className="report-flag-form" onSubmit={handleSubmit}>
                <fieldset className="report-flag-fieldset">
                  <legend className="report-flag-legend">Reason</legend>
                  <ul className="report-flag-reason-list">
                    {REPORT_FLAG_REASONS.map((r) => (
                      <li key={r.code}>
                        <label className="report-flag-radio-label">
                          <input
                            type="radio"
                            name="flag-reason"
                            value={r.code}
                            checked={reason === r.code}
                            onChange={() => {
                              setReason(r.code);
                              setFormError(null);
                            }}
                          />
                          <span>{r.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>

                {reason === 'other' && (
                  <div className="report-flag-details-wrap">
                    <label htmlFor="report-flag-details" className="report-flag-details-label">
                      Briefly describe the issue ({REPORT_FLAG_OTHER_MAX_LEN} characters max)
                    </label>
                    <textarea
                      id="report-flag-details"
                      className="report-flag-details"
                      rows={3}
                      maxLength={REPORT_FLAG_OTHER_MAX_LEN}
                      value={details}
                      onChange={(ev) => setDetails(ev.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                )}

                {formError && (
                  <p className="report-flag-error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="report-flag-actions-row">
                  <button
                    type="button"
                    className="report-flag-cancel"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="report-flag-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
