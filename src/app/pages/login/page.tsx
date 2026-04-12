'use client'

import { login, signInWithGoogle } from "@/app/components/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation"
import { useState } from "react";
import { Err } from "@/app/components/client-components";
import TurnstileField from "@/app/components/turnstile-field";

/**
 * Login page.
 *
 * - Email/password posts to `login`; Google OAuth uses a separate form posting to `signInWithGoogle`.
 * - Includes a password visibility toggle for usability.
 * - Links to the forgot-password flow and sign-up page.
 * - Displays any error message passed via `?err=` query param using `Err`.
 */
export default function Login() {
  const searchParams = useSearchParams();
  const errMessage = searchParams.get('err')
  const nextParam = searchParams.get('next')
  const [showPass, setShowPass] = useState(false)

  const togglePass = () => {
    if(showPass) { setShowPass(false) } 
    else { setShowPass(true) }
  }

  return (
    <div className="login-container">
      <form action={login} className="login-email-form">
        <h2>Sign In</h2>
        {nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && (
          <input type="hidden" name="next" value={nextParam} />
        )}

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="password">Password</label>
        <div className="password-block">
          <input id="password" name="password" className="password"
            type={ showPass ? 'text' : 'password' } required 
          />
          <div onClick={togglePass} className="icon">
            { showPass ? 
              <img src='/assets/hide.png' alt="hide" className="view-icon"/> :
              <img src='/assets/view.png' alt="view" className="view-icon"/> 
            }
          </div>
        </div>

        <Link href='/pages/forgotpass'>Forgot Password?</Link>

        <TurnstileField />

        <button type="submit" className="login-button">Login</button>
      </form>

      <div className="or">or</div>

      <form action={signInWithGoogle} className="login-google-form">
        {nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && (
          <input type="hidden" name="next" value={nextParam} />
        )}
        <button type="submit" className="google-login">
          Sign in with Google
        </button>
      </form>

      <footer>Don&apos;t have an account? <Link href='/pages/signup'>Sign-up here</Link></footer>
      { errMessage ? <Err message={errMessage}/> : <></>}
    </div>
  )
}