'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
 * Two-step form: phone + Send Code at top; when code sent, OTP section extends below
 * with 6 single-digit inputs, "send code again", Submit, and "return to homepage".
 */
export default function VerifyPhoneForm() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
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
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError(null);
    const e164 = formatPhone(phone);
    const result = await sendPhoneOtp(e164);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep('otp');
    startCooldown();
    otpInputRefs.current[0]?.focus();
  };

  const handleSendCodeAgain = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError(null);
    const e164 = formatPhone(phone);
    const result = await sendPhoneOtp(e164);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    startCooldown();
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    otpInputRefs.current[0]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || otp.length !== OTP_LENGTH) return;
    setLoading(true);
    setError(null);
    const e164 = formatPhone(phone);
    const result = await verifyPhoneOtp(e164, otp);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/pages/account?verified=1');
    router.refresh();
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

  return (
    <div className="verify-phone-wrapper">
      <div className="verify-phone-card">
        <h1 className="verify-phone-title">Verify your Account</h1>

        {error && (
          <p className="verify-phone-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSendCode} className="verify-phone-form">
          <label htmlFor="verify-phone-number" className="verify-phone-label">
            Phone Number
          </label>
          <input
            id="verify-phone-number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(714) 234-8210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="verify-phone-input"
          />
          <div className="verify-phone-actions">
            <button
              type="submit"
              className="verify-phone-btn"
              disabled={loading || cooldown > 0}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        </form>

        {step === 'otp' && (
          <>
            <p className="verify-phone-instruction">
              A verification code has been sent to your phone. Please enter the
              code below.
            </p>
            <form onSubmit={handleVerify} className="verify-phone-form verify-phone-otp-form">
              <div className="verify-phone-otp-row" role="group" aria-label="Verification code">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
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
                    disabled={loading}
                  >
                    send code again
                  </button>
                )}
              </p>
              <div className="verify-phone-actions">
                <button
                  type="submit"
                  className="verify-phone-btn"
                  disabled={loading || otp.length !== OTP_LENGTH}
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="verify-phone-home">
          <Link href="/" className="verify-phone-link">
            return to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
