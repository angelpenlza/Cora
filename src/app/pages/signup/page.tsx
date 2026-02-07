'use client'

import { signup } from "@/app/components/actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Signup() {
    const searchParams = useSearchParams()
    const success = searchParams.get('success')
    const err = searchParams.get('err')

    return (
      <form className="signup-container">
        <h2>Sign up</h2>

        <label htmlFor="first-name">First name</label>
        <input id="first-name" name="first-name" required/>

        <label htmlFor="last-name">Last name</label>
        <input id="last-name" name="last-name" required/>

        <label htmlFor="username">Username</label>
        <input id="username" name="username" required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />

        <button formAction={signup} className="signup-button">Sign up</button>
        <footer>Already have an account? <Link href='/pages/login'>Log in here</Link></footer>
        { success ? <div className="success">{success}</div> : <></> }
        { err ? <div className="error">{err}</div> : <></> }
      </form>
    )
  }