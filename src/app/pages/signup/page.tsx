'use client'

import { signup } from "@/app/components/actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function SignupButton() {
  const { pending } = useFormStatus()
  return (
    <button formAction={signup} className="signup-button" disabled={pending}>
      {pending ? 'Signing up...' : 'Sign up'}
    </button>
  )
}

export default function Signup() {
    const searchParams = useSearchParams()
    const success = searchParams.get('success')
    const err = searchParams.get('err')

    return (
      <form className="signup-container">
        <h2>Sign up</h2>

        <label htmlFor="username">Username (min 3 characters)</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          minLength={3}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />

        <SignupButton />
        <footer>Already have an account? <Link href='/pages/login'>Log in here</Link></footer>
        { success ? <div className="success">{success}</div> : <></> }
        { err ? <div className="error">{err}</div> : <></> }
      </form>
    )
  }