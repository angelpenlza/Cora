'use client'

import Link from "next/link"
import { type User } from "@supabase/supabase-js"
import { signout } from "./actions"

/**
 * Top navigation bar.
 *
 * - Shows different links depending on whether a Supabase `user` is present.
 * - Uses a client-side confirmation dialog before triggering the `signout` server action.
 */

/**
 * Links visible only when the user is authenticated.
 */
const LoggedInItems = () => {
  const confirmSignout = () => {
    const cont = window.confirm('are you sure you want to log out?');
    if(cont) signout();
  }
  return (
    <>
      <Link href='/pages/upload' className="navbar-item">Upload</Link>
      <Link href='/pages/account' className="navbar-item">Account</Link>
      <div onClick={confirmSignout} className="navbar-item">Signout</div>
    </>
  )
}

/**
 * Links visible when there is no authenticated user.
 */
const LoggedOutItems = () => {
  return (
    <>
      <Link href='/pages/login' className="navbar-item">Login</Link>
      <Link href='/pages/signup' className="navbar-item">Signup</Link>
    </>
  )
}

/**
 * Wrapper component that chooses which set of nav items to render
 * based on the current Supabase `user` (passed from the root layout).
 */
export default function NavBar({ user }: { user: User | null }) {

  return (
    <div className="navbar-container">
      <Link href='/' className="navbar-item">Cora</Link>
      <div className="navbar-space"></div>
      { user ? <LoggedInItems /> : <LoggedOutItems /> }
    </div>
  )
}