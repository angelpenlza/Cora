import path from 'path'
import { createServerClient } from '@supabase/ssr'
const publicRoutes = ['/pages/login', '/pages/signup']
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/pages/account', '/pages/upload', '/pages/forgotpass/resetpass']

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

  // protecting routes
  const pathname = request.nextUrl.pathname
  const isProtected = protectedRoutes.includes(pathname)

  if(isProtected && session.error) {
    return NextResponse.redirect(new URL('/pages/login', request.url))
  }
  
  return supabaseResponse
}