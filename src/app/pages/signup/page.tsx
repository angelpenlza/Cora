/*
  Sign up page — split hero + form (desktop); stacked (mobile).
  - Username (min 3), email, matching passwords + Turnstile; Google OAuth.
*/

'use client'

import { signInWithGoogle, signup } from '@/app/components/actions'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import TurnstileField from '@/app/components/turnstile-field'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Err } from '@/app/components/client-components'

function SignupButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" formAction={signup} className="signup-page__submit" disabled={pending}>
      {pending ? 'Creating account…' : 'Create Account'}
    </button>
  )
}

function GoogleMark() {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 25,
      height: 25,
      borderRadius: "50%",
      backgroundColor: "#fff",
    }}>
    <svg className="signup-page__google-mark" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
    </div>
  )
}

export default function Signup() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const err = searchParams.get('err')
  const [pass, setPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  const arePassesEqual = confirmPass === pass

  const togglePass = () => {
    setShowPass((v) => !v)
  }

  return (
    <div className="signup-page">
      <aside className="signup-page__hero" aria-labelledby="signup-welcome-heading">
        <div className="signup-page__hero-inner">
          <h1 id="signup-welcome-heading" className="signup-page__welcome-title">
            <span className="signup-page__welcome-line">
              Welcome to Cora<Image src="/favicon.ico" alt="" width={32} height={32} className="signup-page__welcome-period" unoptimized />
            </span>
          </h1>
          <p className="signup-page__welcome-lede">
            Creating an account will unlock your voice in this community.
          </p>

          <ul className="signup-page__features">
            <li className="signup-page__feature signup-page__feature--orange">
              <div className="signup-page__feature-icon-wrap">
                <Image
                  src="/assets/lightning-icon.png"
                  alt=""
                  width={96}
                  height={96}
                  className="signup-page__feature-icon-img"
                  unoptimized
                />
              </div>
              <div>
                <p className="signup-page__feature-title">Live Updates</p>
                <p className="signup-page__feature-text">
                  Real-time alerts pushed as soon as a user posts it on their end.
                </p>
              </div>
            </li>
            <li className="signup-page__feature signup-page__feature--green">
              <div className="signup-page__feature-icon-wrap">
                <Image
                  src="/assets/community-icon.png"
                  alt=""
                  width={96}
                  height={96}
                  className="signup-page__feature-icon-img"
                  unoptimized
                />
              </div>
              <div>
                <p className="signup-page__feature-title">Community</p>
                <p className="signup-page__feature-text">
                  A verified community just as curious and concerned about their surroundings as you!
                </p>
              </div>
            </li>
            <li className="signup-page__feature signup-page__feature--blue">
              <div className="signup-page__feature-icon-wrap">
                <Image
                  src="/assets/instant-access-icon.png"
                  alt=""
                  width={96}
                  height={96}
                  className="signup-page__feature-icon-img"
                  unoptimized
                />
              </div>
              <div>
                <p className="signup-page__feature-title">Instant Access</p>
                <p className="signup-page__feature-text">
                  Access the website or app from any device!
                </p>
              </div>
            </li>
          </ul>

          <div className="signup-page__hero-art">
            <Image
              src="/assets/inclusive-community.png"
              alt=""
              width={560}
              height={320}
              className="signup-page__hero-img"
              priority
              unoptimized
            />
          </div>
        </div>
      </aside>

      <div className="signup-page__panel">
        <form className="signup-page__form">
          <h2 className="signup-page__form-title">Sign Up</h2>
          <p className="signup-page__form-subtitle">Join us in making Orange County Safer!</p>

          <div className="signup-page__field">
            <div className="signup-page__label-row">
              <label htmlFor="username" className="signup-page__label">
                Username
              </label>
              <span className="signup-page__label-hint">(min. 3 characters)</span>
            </div>
            <input
              id="username"
              name="username"
              className="signup-page__input"
              autoComplete="username"
              minLength={3}
              placeholder="example"
              required
            />
          </div>

          <div className="signup-page__field">
            <label htmlFor="email" className="signup-page__label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="signup-page__input"
              autoComplete="email"
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div className="signup-page__field">
            <label htmlFor="password" className="signup-page__label">
              Password
            </label>
            <div className="signup-page__password-block">
              <input
                id="password"
                name="password"
                className="signup-page__input signup-page__input--with-toggle"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                required
                onChange={(e) => setPass(e.target.value)}
              />
              <button
                type="button"
                className="signup-page__eye"
                onClick={togglePass}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <img src="/assets/hide.png" alt="" className="signup-page__eye-img" />
                ) : (
                  <img src="/assets/view.png" alt="" className="signup-page__eye-img" />
                )}
              </button>
            </div>
          </div>

          <div className="signup-page__field">
            <label htmlFor="confirm-password" className="signup-page__label">
              Confirm Password
            </label>
            <div className="signup-page__password-block">
              <input
                id="confirm-password"
                name="confirm_password"
                className="signup-page__input signup-page__input--with-toggle"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                required
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              <button
                type="button"
                className="signup-page__eye"
                onClick={togglePass}
                aria-label={showPass ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showPass ? (
                  <img src="/assets/hide.png" alt="" className="signup-page__eye-img" />
                ) : (
                  <img src="/assets/view.png" alt="" className="signup-page__eye-img" />
                )}
              </button>
            </div>
          </div>

          <div className="signup-page__turnstile">
            <TurnstileField size="flexible" />
          </div>

          {arePassesEqual ? (
            <SignupButton />
          ) : (
            <>
              <p className="signup-page__mismatch" role="status">
                Passwords must match to continue.
              </p>
              <div className="signup-page__submit signup-page__submit--blocked" aria-disabled>
                Create Account
              </div>
            </>
          )}

          {success ? <p className="signup-page__success">{success}</p> : null}
          {err ? <Err message={err} /> : null}
        </form>

        <div className="signup-page__or" aria-hidden="true">
          <span className="signup-page__or-line" />
          <span className="signup-page__or-text">or</span>
          <span className="signup-page__or-line" />
        </div>

        <form action={signInWithGoogle} className="signup-page__google-form">
          <button type="submit" className="signup-page__google">
            <GoogleMark />
            Sign Up with Google
          </button>
        </form>

        <footer className="signup-page__footer">
          <p className="signup-page__footer-line">
            Already have an account?{' '}
            <Link href="/pages/login" className="signup-page__footer-link">
              Sign in here
            </Link>
          </p>
          <Link href="/" className="signup-page__home-link">
            ← return to homepage
          </Link>
        </footer>
      </div>
    </div>
  )
}
