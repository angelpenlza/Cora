/* 
  Forgot Password page 
  - public route, no authenitcation restrictions
  - input: 
      user enters a valid email address 
  - output: 
      sends a reset password link to the email addess
      which redirects the supposed to redirect the user to 
      /pages/forgotpass/resetpass (doesn't properly redirect, 
      more info on resetpass page)
  - page does NOT check to see if email is registered before 
    it sends a recovery link, so any valid email address entered
    will recieve a link
*/

'use client'

import { forgotpass } from "@/app/components/actions";
import { useSearchParams } from "next/navigation";
import Err from "@/app/components/err";

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