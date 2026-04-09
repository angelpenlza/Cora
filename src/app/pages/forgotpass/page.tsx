'use client'

import { forgotpass } from "@/app/components/actions";
import { useSearchParams } from "next/navigation";
import { Err } from "@/app/components/client-components";

/**
 * "Forgot password" page.
 *
 * - Collects an email address and posts it to the `forgotpass` server action.
 * - Displays success or error messages passed back as query parameters.
 *
 * The actual reset is completed on the dedicated `/pages/forgotpass/resetpass`
 * page once the user follows the Supabase email link.
 */
export default function ForgotPass() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const err = searchParams.get('err')

  return (
    <form>
      <h2>Password Reset</h2>
      <label htmlFor="email">Email</label>
      <input name="email" type="email" required />
      <button formAction={forgotpass}>Send Email</button>
      { success ? <div>{success}</div> : <></> } 
      { err ? <Err message={err}/> : <></> }
    </form>
  )
}