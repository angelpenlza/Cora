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
import GoogleOAuthMark from '@/app/components/google-oauth-mark'

function SignupButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" formAction={signup} className="signup-page__submit" disabled={pending}>
      {pending ? 'Creating account…' : 'Create Account'}
    </button>
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
              Welcome to Cora<Image src="/favicon.ico" alt="" width={32} height={32} className="signup-page__welcome-period" />
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
                  <Image src="/assets/hide.png" alt="" width={20} height={20} className="signup-page__eye-img" />
                ) : (
                  <Image src="/assets/view.png" alt="" width={20} height={20} className="signup-page__eye-img" />
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
                  <Image src="/assets/hide.png" alt="" width={20} height={20} className="signup-page__eye-img" />
                ) : (
                  <Image src="/assets/view.png" alt="" width={20} height={20} className="signup-page__eye-img" />
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
            <GoogleOAuthMark />
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
