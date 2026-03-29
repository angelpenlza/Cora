/* 
  Log in page
  - added a toggle password button, which allows the 
    user to change the input type from 'passord' to 
    'text', in case they want to see their password
  - added link to /pages/forgotpass for password support
*/

'use client'

import { login, signInWithGoogle } from "@/app/components/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation"
import { useState } from "react";
import Err from "@/app/components/err";
import Script from "next/script";

/**
 * Login page.
 *
 * - Renders an email/password form that posts to the `login` server action.
 * - Includes a password visibility toggle for usability.
 * - Links to the forgot-password flow and sign-up page.
 * - Displays any error message passed via `?err=` query param using `Err`.
 */
export default function Login() {
  const searchParams = useSearchParams();
  const errMessage = searchParams.get('err')
  const [showPass, setShowPass] = useState(false)

  const togglePass = () => {
    if(showPass) { setShowPass(false) } 
    else { setShowPass(true) }
  }

  return (
    <form className="login-container">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
      <h2>Sign In</h2>
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

      <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="light"
        />

      <button formAction={login} type="submit" className="login-button">Login</button>
      <div className="or">or</div>
      <div onClick={signInWithGoogle} className="google-login">Sign in with Google</div>
      <footer>Don&apos;t have an account? <Link href='/pages/signup'>Sign-up here</Link></footer>
      { errMessage ? <Err message={errMessage}/> : <></>}
    </form>
  )
}