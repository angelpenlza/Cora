'use server'

/**
 * Server Actions: authentication + account lifecycle.
 *
 * These functions run on the server (never in the browser) and are invoked from
 * forms/components via `formAction`. They generally:
 * - Call Supabase Auth APIs using the server client (cookie-aware session).
 * - Use redirects for control flow (success + error messages via query params).
 * - Revalidate the root layout so nav/session state updates immediately.
 *
 * Note: redirects throw internally in Next.js; code after `redirect()` does not run.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/** Minimum username length enforced before attempting sign-up. */
const USERNAME_MIN_LENGTH = 3

/**
 * Normalize form values: coerce `null` to empty string and trim whitespace.
 *
 * Server actions receive `FormDataEntryValue | null`; this helper keeps the
 * downstream logic consistent and avoids repeated casting.
 */
function trim(value: FormDataEntryValue | null): string {
  return (value ?? '').toString().trim()
}

/**
 * Log a user in using Supabase email/password authentication.
 *
 * On failure, redirects back to the login page with a human-readable error.
 * On success, revalidates the layout (to refresh user state) and redirects home.
 */
export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/pages/login?err=Invalid Credentials')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Create a new user account via Supabase Auth.
 *
 * - Validates username length.
 * - Checks `profiles.username` uniqueness (application-level constraint).
 * - Stores `username/full_name` in Auth user metadata (options.data).
 *
 * Success redirects back to signup with a "check your email" message because
 * email verification may be enabled in Supabase.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const rawUsername = trim(formData.get('username'))
  const email = trim(formData.get('email'))
  const password = formData.get('password') as string

  if (rawUsername.length < USERNAME_MIN_LENGTH) {
    redirect(`/pages/signup?err=Username must be at least ${USERNAME_MIN_LENGTH} characters.`)
  }


  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', rawUsername)
    .maybeSingle()

  if (existing) {
    redirect('/pages/signup?err=Username already taken.')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: rawUsername,
        full_name: rawUsername,
      },
    },
  })

  if (error) {
    const message =
      error.message?.toLowerCase().includes('already registered') ||
      error.code === 'user_already_exists'
        ? 'Email already registered.'
        : error.message || 'Sign up failed. Try again.'
    redirect(`/pages/signup?err=${encodeURIComponent(message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/pages/signup?success=Verification email sent. Check your inbox.')
}

/**
 * Sign the current user out and redirect to login.
 *
 * Layout is revalidated so the navbar immediately reflects signed-out state.
 */
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout')
  redirect('/pages/login')
}

/**
 * Request a password reset email via Supabase.
 *
 * Uses the request `Origin` header (or a configured fallback) to build an
 * absolute redirect URL for the recovery link.
 */
export async function forgotpass(formData: FormData) {
  const supabase = await createClient()
  const email = trim(formData.get('email'))

  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_HOME_PAGE

  if (!origin) {
    redirect(
      `/pages/forgotpass?err=${encodeURIComponent(
        'Password reset is not configured. Please contact support.'
      )}`
    )
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/pages/forgotpass/resetpass`
  })

  if (error) {
    const message =
      error.message || 'Failed to send reset link. Please try again.'
    redirect(`/pages/forgotpass?err=${encodeURIComponent(message)}`)
  }

  redirect(
    `/pages/forgotpass?success=${encodeURIComponent(
      'Reset link sent to email.'
    )}`
  )
}

/**
 * Complete a password reset flow.
 *
 * Expected inputs (via form):
 * - `code`: Supabase recovery code from the email link.
 * - `password` + `confirmPassword`: new password confirmation.
 *
 * Flow:
 * 1) Exchange recovery code for a session (required by Supabase).
 * 2) Update password for the authenticated user.
 */
export async function resetpass(formData: FormData) {
  const supabase = await createClient()
  const password = trim(formData.get('password'))
  const confirmPassword = trim(formData.get('confirmPassword'))
  const code = trim(formData.get('code'))

  if (!code) {
    redirect(
      `/pages/forgotpass/resetpass?err=${encodeURIComponent(
        'Invalid or missing reset code. Please request a new link.'
      )}`
    )
  }

  if (!password) {
    redirect(
      `/pages/forgotpass/resetpass?err=${encodeURIComponent(
        'Password is required.'
      )}`
    )
  }

  if (password !== confirmPassword) {
    redirect(
      `/pages/forgotpass/resetpass?err=${encodeURIComponent(
        'Passwords do not match.'
      )}`
    )
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  )

  if (exchangeError) {
    redirect(
      `/pages/forgotpass/resetpass?err=${encodeURIComponent(
        'Reset link is invalid or has expired. Please request a new link.'
      )}`
    )
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    const message =
      error.message || 'Failed to reset password. Please try again.'
    redirect(
      `/pages/forgotpass/resetpass?err=${encodeURIComponent(
        message
      )}`
    )
  }

  redirect(
    `/pages/login?success=${encodeURIComponent(
      'Password updated. You can now log in.'
    )}`
  )
}
