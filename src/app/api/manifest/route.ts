import { NextRequest } from 'next/server';

/**
 * Dynamic PWA manifest endpoint.
 *
 * This route responds at `/api/manifest` (rewritten to `/manifest.json` in `next.config.ts`).
 * Using a handler instead of a static JSON file allows the `start_url`, `id`, and icon URLs
 * to be constructed from the incoming request origin (supporting multiple environments).
 */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin; // origin is the base url of the request so on local it's http://localhost:3000 and on production it's https://cora.fyi

  // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest
  const manifest = {
    name: 'Cora',
    short_name: 'Cora',
    id: `${base}/`,//id identifies what version of the app is being installed localhost or production
    scope: `${base}/`,//what pages can the app navigate to if we had any desktop specific pages we would exclude them from the scope
    description: 'A community reporting platform built especially for Orange County!',//metadata description
    start_url: `${base}/`,//landing page of the app when the app is launched
    display: 'standalone' as const,//specify preferred display mode for the app
    background_color: '#ff8800',//splash screen background color
    theme_color: '#ff8800',// colors the statis nar
    orientation: 'portrait-primary' as const,
    icons: [
      { src: `${base}/assets/icons/apple-touch-icon.png`, sizes: '192x192', type: 'image/png', purpose: 'any' as const },// Apple Touch Icon
      { src: `${base}/assets/icons/android-splash-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' as const },// Android Home Screen Icon
      { src: `${base}/assets/icons/apple-touch-icon.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },// Apple Touch Icon masked
      { src: `${base}/assets/icons/android-splash-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },//Masked Android Home Screen Icon
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
