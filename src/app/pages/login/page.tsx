'use client'

import { login } from "@/app/components/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation"

export default function Login() {
  const searchParams = useSearchParams();
  const errMess = searchParams.get('err')

  return (
    <form className="login-container">
      <h2>Login</h2>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login} className="login-button">Login</button>
      <footer>Don't have an account? <Link href='/pages/signup'>Sign-up here</Link></footer>
      { errMess ? <div className="error">Error: {errMess}</div> : <></>}
    </form>
  )
}