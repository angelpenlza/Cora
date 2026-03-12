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

  // commented out for now because when signing up, the user is redirected to the
  // home page with a code, and since the home page has a code but isn't the resetpass
  // page, it you get sent to the redirect page after signing up, which is undesired
  // If Supabase sent us a recovery link to the wrong path (e.g. '/?code=...'),
  // normalize it to the dedicated reset password page.
  if (code && pathname !== '/pages/resetpass' && pathname !== '/') {
    const redirectUrl = new URL('/pages/resetpass', request.url)
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