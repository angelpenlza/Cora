import path from 'path'
import { createServerClient } from '@supabase/ssr'
const publicRoutes = ['/pages/login', '/pages/signup']
import { NextResponse, type NextRequest } from 'next/server'

// Upload is reachable while signed out; the page shows a sign-in modal instead of middleware redirect.
const protectedRoutes = ['/pages/account', '/pages/verify-phone'];

/**
 * Middleware-style helper for keeping Supabase auth sessions in sync with Next.
 *
 * Responsibilities:
 * - Hydrate/refresh the Supabase session on each request (via cookies).
 * - Normalize password recovery links to the dedicated reset page.
 * - Enforce simple route protection for authenticated-only pages.
 *
 * Used from `src/proxy.ts` which is wired into Next's middleware config.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      auth: {
        flowType: 'pkce',
      },
    }
  )

  // refreshing the auth token
  const session = await supabase.auth.getUser()

  const url = request.nextUrl
  const pathname = url.pathname
  const code = url.searchParams.get('code')

  if(!code && pathname === '/pages/resetpass') {
    return NextResponse.redirect(new URL('/pages/forgotpass?err=Open page through the link sent to your email.', request.url))
  }

  // If Supabase sent us a recovery link to the wrong path (e.g. '/some/page?code=...'),
  // normalize it to the dedicated reset password page. Do NOT redirect when the path
  // is /auth/callback (OAuth sign-in) or / (email sign-up can land here with a code).
  const isOAuthOrRoot = pathname === '/auth/callback' || pathname === '/'
  if (code && pathname !== '/pages/resetpass' && !isOAuthOrRoot) {
    const redirectUrl = new URL('/pages/resetpass', request.url)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl)
  }

  if(code && pathname === '/') {
    console.log(path)
  }

  // protecting routes
  const isProtected = protectedRoutes.includes(pathname)

  if (isProtected && session.error) {
    return NextResponse.redirect(new URL('/pages/login', request.url))
  }

  return supabaseResponse
}