'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const USERNAME_MIN_LENGTH = 3

function trim(value: FormDataEntryValue | null): string {
  return (value ?? '').toString().trim()
}

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

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout')
  redirect('/pages/login')
}

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

export async function resetpass(formData: FormData) {
  const supabase = await createClient()
  const password = trim(formData.get('password'))
  const confirmPassword = trim(formData.get('confirmPassword'))

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

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    const message = error.message?.toLowerCase().includes('jwt') ||
      error.message?.toLowerCase().includes('session')
      ? 'Reset link is invalid or has expired. Please request a new link.'
      : error.message || 'Failed to reset password. Please try again.'

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
