'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/pages/login?err=Invalid Credentials')
    
  } else {
    revalidatePath('/', 'layout')
    redirect('/')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/pages/signup?err=Issue signing up, try again.')
  }

  revalidatePath('/', 'layout')
  redirect('/pages/signup?success=Verification email sent, check your inbox.')
}

export async function signout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout')
    redirect('/pages/login')
}
