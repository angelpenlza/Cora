/* 
  Reset Password page
  - private route, must be a verfied user to access the page
  - proxy protects this page by redirecting unauthenticated 
    users to /pages/login, where they can access the forgot 
    password link
  - /pages/forgotpass is able to successfully send a reset link
    to the email provided
  - the link takes the user to the following URL: 
    http://localhost:3000/pages/forgotpass/resetpass?code=generated-code
    which does not work properly

  - attempts to fix the issue:
    - added the redirect URLs in the Supabase settings 
      (Cora Database > Authentication > URL Configuration)
*/

'use client'

import { resetpass } from "@/app/components/actions";

export default function ResetPass() {

  return (
    <form>
      <h2>Password Reset</h2>
      <label htmlFor="password">Enter new password</label>
      <input name="password" type="password" required />
      <button formAction={resetpass}>Reset Password</button>
    </form>
  ) 
}