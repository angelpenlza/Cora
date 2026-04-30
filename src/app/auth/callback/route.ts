import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

type EmailOtpType = 'signup' | 'recovery' | 'email' | 'invite' | 'email_change'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const otpType = searchParams.get('type')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  const supabase = await createClient()
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      revalidatePath('/', 'layout')
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Some Supabase email templates/flows provide token_hash + type instead of code.
  if (tokenHash && otpType) {
    const validEmailOtpTypes: EmailOtpType[] = [
      'signup',
      'recovery',
      'email',
      'invite',
      'email_change',
    ]
    if (!validEmailOtpTypes.includes(otpType as EmailOtpType)) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
    const type = otpType as EmailOtpType
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    if (!error) {
      revalidatePath('/', 'layout')
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}