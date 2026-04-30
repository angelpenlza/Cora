'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@/app/components/phone-verification-actions';

const COOLDOWN_SEC = 600;
const OTP_LENGTH = 6;

function formatPhone(raw: string): string {
  const digits = raw.trim().replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length >= 10 && digits.length <= 15) return '+' + digits;
  return '+1' + digits;
}

/**
 * Phone verification: Figma layout with hero art, phone row + icon,
 * Send Code, optional OTP panel (light blue), Submit, return link.
 */
export default function VerifyPhoneForm() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = otpDigits.join('');

  const startCooldown = () => {
    setCooldown(COOLDOWN_SEC);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingSend || loadingVerify || (step === 'otp' && cooldown > 0)) return;
    setLoadingSend(true);
    setError(null);
    const e164 = formatPhone(phone);
    try {
      const result = await sendPhoneOtp(e164);
      if (result.error) {
        setError(result.error);
        setLoadingSend(false);
        return;
      }
      setStep('otp');
      startCooldown();
      otpInputRefs.current[0]?.focus();
    } catch {
      setError('Unable to reach the verification service. Please check your connection and try again.');
    }
    setLoadingSend(false);
  };

  const handleSendCodeAgain = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loadingSend || loadingVerify || cooldown > 0) return;
    setLoadingSend(true);
    setError(null);
    const e164 = formatPhone(phone);
    try {
      const result = await sendPhoneOtp(e164);
      if (result.error) {
        setError(result.error);
        setLoadingSend(false);
        return;
      }
      startCooldown();
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpInputRefs.current[0]?.focus();
    } catch {
      setError('Unable to reach the verification service. Please check your connection and try again.');
    }
    setLoadingSend(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingSend || loadingVerify || otp.length !== OTP_LENGTH) return;
    setLoadingVerify(true);
    setError(null);
    const e164 = formatPhone(phone);
    try {
      const result = await verifyPhoneOtp(e164, otp);
      if (result.error) {
        setError(result.error);
        setLoadingVerify(false);
        return;
      }
      router.push('/pages/account?verified=1');
      router.refresh();
    } catch {
      setError('Unable to reach the verification service. Please check your connection and try again.');
    }
    setLoadingVerify(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setOtpDigits(next);
      const focusIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpInputRefs.current[focusIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const sendDisabled =
    loadingSend || loadingVerify || (step === 'otp' && cooldown > 0);

  return (
    <div className="verify-phone-page">
      <div className="verify-phone-card">
        <div className="verify-phone-hero">
          <Image
            src="/assets/verify-account-image.png"
            alt=""
            width={440}
            height={250}
            sizes="(max-width: 480px) 52vw, 220px"
            priority
            style={{ width: '100%', height: 'auto' }}
          />
        </div>

        <h1 className="verify-phone-title">Finish Setting Up Your Profile</h1>
        <p className="verify-phone-lead">
          Verification helps us ensure that every member of the Cora community is a
          real person and limited to one account.
        </p>

        {error ? (
          <p className="verify-phone-error" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSendCode} className="verify-phone-form">
          <label htmlFor="verify-phone-number" className="verify-phone-label">
            Phone Number
          </label>
          <div className="verify-phone-input-wrap">
            <span className="verify-phone-input-icon" aria-hidden>
              <Image
                src="/assets/verify-account-phone-icon.png"
                alt=""
                width={18}
                height={18}
              />
            </span>
            <input
              id="verify-phone-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(###) ### - ####"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="verify-phone-input"
            />
          </div>
          <div className="verify-phone-actions">
            <button type="submit" className="verify-phone-btn" disabled={sendDisabled}>
              {loadingSend ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        </form>

        {step === 'otp' ? (
          <div className="verify-phone-otp-panel">
            <p className="verify-phone-instruction">
              A verification code has been sent to your phone. Please enter the code
              below.
            </p>
            <form onSubmit={handleVerify} className="verify-phone-otp-form">
              <div className="verify-phone-otp-row" role="group" aria-label="Verification code">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="verify-phone-otp-digit"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              <p className="verify-phone-resend">
                {cooldown > 0 ? (
                  <span className="verify-phone-cooldown">
                    send code again in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCodeAgain}
                    className="verify-phone-link"
                    disabled={loadingSend || loadingVerify}
                  >
                    send code again
                  </button>
                )}
              </p>
              <div className="verify-phone-actions">
                <button
                  type="submit"
                  className="verify-phone-btn"
                  disabled={loadingSend || loadingVerify || otp.length !== OTP_LENGTH}
                >
                  {loadingVerify ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="verify-phone-footer">
          <Link href="/" className="verify-phone-home-link">
            ← return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
