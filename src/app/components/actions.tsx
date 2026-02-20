'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_HOME_PAGE + '/pages/forgotpass/resetpass'
  })
  
  redirect('/pages/forgotpass?success=Reset link sent to email')
}

export async function resetpass(formData: FormData) {
  const supabase = await createClient()
  const password = trim(formData.get('password'))

  await supabase.auth.updateUser({ password: password })
}
