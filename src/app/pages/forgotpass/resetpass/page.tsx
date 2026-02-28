/* 
  Reset Password page
  - public entry point from Supabase reset email link
  - expects a `code` query parameter in the URL, which is
    used on the server to exchange for a session before
    updating the user's password
*/

'use client'

import { resetpass } from "@/app/components/actions";
import { useSearchParams } from "next/navigation";
import Err from "@/app/components/err";

/**
 * Reset password page.
 *
 * - Entry point for users coming from the Supabase password reset email.
 * - Expects a `code` query parameter which is passed through to the server action.
 * - Collects and validates new password + confirmation on the server side.
 */
export default function ResetPass() {
  const searchParams = useSearchParams();
  const err = searchParams.get("err");
  const code = searchParams.get("code") ?? "";

  return (
    <form>
      <h2>Password Reset</h2>
      <label htmlFor="password">Enter new password</label>
      <input name="password" type="password" required />

      <label htmlFor="confirmPassword">Confirm new password</label>
      <input name="confirmPassword" type="password" required />

      {/* Carry the Supabase reset code through to the server action */}
      <input type="hidden" name="code" value={code} />

      <button formAction={resetpass}>Reset Password</button>
      {err ? <Err message={err} /> : null}
    </form>
  );
}