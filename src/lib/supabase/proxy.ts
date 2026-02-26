import path from 'path'
import { createServerClient } from '@supabase/ssr'
const publicRoutes = ['/pages/login', '/pages/signup']
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/pages/account', '/pages/upload']

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
    }
  )

  // refreshing the auth token
  const session = await supabase.auth.getUser()

  const url = request.nextUrl
  const pathname = url.pathname
  const code = url.searchParams.get('code')

  // If Supabase sent us a recovery link to the wrong path (e.g. '/?code=...'),
  // normalize it to the dedicated reset password page.
  if (code && pathname !== '/pages/forgotpass/resetpass') {
    const redirectUrl = new URL('/pages/forgotpass/resetpass', request.url)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl)
  }

  // protecting routes
  const isProtected = protectedRoutes.includes(pathname)

  if (isProtected && session.error) {
    return NextResponse.redirect(new URL('/pages/login', request.url))
  }

  return supabaseResponse
}