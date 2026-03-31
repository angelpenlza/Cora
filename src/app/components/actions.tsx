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
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { deleteImage } from './cfhelpers'
import { NextRequest } from 'next/server'
import { create } from 'domain'

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
  const origin = (await headers()).get('origin')
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
      emailRedirectTo: `${origin}`
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

/*-------------------------
updateProfile()
- update the user's information
*/
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  console.log('updating profile...')
  const getImage: File = formData.get('image') as File;
  const username = trim(formData.get('username'));
  const name = trim(formData.get('name'));
  const phoneNum = trim(formData.get('phone'));
  const uid = trim(formData.get('uid'));

  const image = getImage.name != 'undefined' ? `${username}-${getImage.name}` : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: name,
      username: username,
      avatar_url: image,
      phone: phoneNum
    })
    .eq('id', uid)


  if(error) {
    redirect(`/pages/account?err=${error.message}`)
  } else {
    redirect('/pages/account?success=Account updated successfully')
  }
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
      `/pages/resetpass?err=${encodeURIComponent(
        'Invalid or missing reset code. Please request a new link.'
      )}`
    )
  }

  if (!password) {
    redirect(
      `/pages/resetpass?err=${encodeURIComponent(
        'Password is required.'
      )}`
    )
  }

  if (password !== confirmPassword) {
    redirect(
      `/pages/resetpass?err=${encodeURIComponent(
        'Passwords do not match.'
      )}`
    )
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  )

  if (exchangeError) {
    redirect(
      `/pages/resetpass?err=${encodeURIComponent(
        'Reset link is invalid or has expired. Please request a new link.'
      )}`
    )
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    const message =
      error.message || 'Failed to reset password. Please try again.'
    redirect(
      `/pages/resetpass?err=${encodeURIComponent(
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

export async function signInWithGoogle() {
  const origin = (await headers()).get('origin')
  const supabase = await createClient()
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if(error) {
    console.log(error) 
  } else {
    return redirect(data.url)
  }
}

export async function revalidate() {
  revalidatePath('/', 'layout')
}


/*-------------------------------
Delete Report
  must be used in a form 

  Input
  - form must have 'rid' value containing a valid report ID
  
  Output
  - deletes image from Cloudflare, then removes entry from Supabase
-------------------------------*/
export async function deleteReport(formData: FormData) {
  const rid: any = formData.get('rid')
  const supabase = await createClient();

  const { data: report} = await supabase 
    .from('reports')
    .select('*')
    .eq('report_id', rid)
    .single()

  if(!report) {
    console.log('error: report has no value')
    return
  }

  // delete the image from cloudflare
  const cfRes = await deleteImage(`${rid}-${report.report_image}`);

  if(cfRes === 200) {
    console.log('cloudflare: image deleted successfully')
  } else  {
    console.log('cloudflare: failed to delete image')
    return 
  }

  // delete the entry from supabase
  const sbRes = await supabase
    .from('reports')
    .delete()
    .eq('report_id', report.report_id)

  if(sbRes.status === 204) {
    console.log('supabase: successfully deleted')
  } else {
    console.log(`supabase: failed to delete report of ID ${report.report_id} due to this error: ${sbRes.error?.message}`)
    return
  }

  console.log('deleted successfully')
  revalidate()
}

