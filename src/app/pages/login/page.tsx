'use client'

import { login, signInWithGoogle } from '@/app/components/actions'
import GoogleOAuthMark from '@/app/components/google-oauth-mark'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Err } from '@/app/components/client-components'
import TurnstileField from '@/app/components/turnstile-field'

/**
 * Sign in page — split hero + form (desktop), stacked (mobile), aligned with sign up styling.
 */
export default function Login() {
  const searchParams = useSearchParams()
  const errMessage = searchParams.get('err')
  const nextParam = searchParams.get('next')
  const [showPass, setShowPass] = useState(false)

  const togglePass = () => {
    setShowPass((v) => !v)
  }

  return (
    <div className="login-page">
      <aside className="login-page__hero" aria-labelledby="login-welcome-heading">
        <div className="login-page__hero-inner">
          <h1 id="login-welcome-heading" className="login-page__welcome-title">
            Welcome Back!
          </h1>
          <div className="login-page__hero-art">
            <Image
              src="/assets/sign-in-hero.png"
              alt=""
              width={960}
              height={540}
              className="login-page__hero-img"
              priority
            />
          </div>
        </div>
      </aside>

      <div className="login-page__panel">
        <form action={login} className="login-page__form">
          <h2 className="login-page__form-title">Sign In</h2>
          <p className="login-page__form-subtitle">Take a look around and see what&apos;s new!</p>
          {nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && (
            <input type="hidden" name="next" value={nextParam} />
          )}

          <div className="login-page__field">
            <label htmlFor="email" className="login-page__label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="login-page__input"
              autoComplete="email"
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div className="login-page__field">
            <label htmlFor="password" className="login-page__label">
              Password
            </label>
            <div className="login-page__password-block">
              <input
                id="password"
                name="password"
                className="login-page__input login-page__input--with-toggle"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="login-page__eye"
                onClick={togglePass}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <Image src="/assets/hide.png" alt="" width={20} height={20} className="login-page__eye-img" />
                ) : (
                  <Image src="/assets/view.png" alt="" width={20} height={20} className="login-page__eye-img" />
                )}
              </button>
            </div>
          </div>

          <Link href="/pages/forgotpass" className="login-page__forgot">
            Forgot Password?
          </Link>

          <div className="login-page__turnstile">
            <TurnstileField size="flexible" />
          </div>

          <button type="submit" className="login-page__submit">
            Sign In
          </button>
          {errMessage ? <Err message={errMessage} /> : null}
        </form>

        <div className="login-page__or" aria-hidden="true">
          <span className="login-page__or-line" />
          <span className="login-page__or-text">or</span>
          <span className="login-page__or-line" />
        </div>

        <form action={signInWithGoogle} className="login-page__google-form">
          {nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && (
            <input type="hidden" name="next" value={nextParam} />
          )}
          <button type="submit" className="login-page__google">
            <GoogleOAuthMark />
            Sign In with Google
          </button>
        </form>

        <footer className="login-page__footer">
          <p className="login-page__footer-line">
            Don&apos;t have an account yet?{' '}
            <Link href="/pages/signup" className="login-page__footer-link">
              Sign up here
            </Link>
          </p>
          <Link href="/" className="login-page__home-link">
            ← return to homepage
          </Link>
        </footer>
      </div>
    </div>
  )
}
