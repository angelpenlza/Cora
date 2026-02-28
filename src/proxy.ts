import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Next.js middleware entrypoint used to:
 * - Keep Supabase auth cookies in sync on each request.
 * - Redirect recovery links to the proper reset password route.
 * - Guard authenticated-only pages.
 */
export async function proxy(request: NextRequest) {
  // update user's auth session
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets/ (public assets: favicons, icons, images)
     * - favicon.ico (favicon file at root)
     * - sw.js, manifest.json, api/manifest (PWA: must never redirect or auth-gate)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|assets/|favicon.ico|sw\\.js|manifest\\.json|api/manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}