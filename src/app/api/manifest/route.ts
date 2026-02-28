import { NextRequest } from 'next/server';

/**
 * Dynamic PWA manifest endpoint.
 *
 * This route responds at `/api/manifest` (rewritten to `/manifest.json` in `next.config.ts`).
 * Using a handler instead of a static JSON file allows the `start_url`, `id`, and icon URLs
 * to be constructed from the incoming request origin (supporting multiple environments).
 */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;

  // Android/Chrome home screen icon comes from manifest (iOS uses apple-touch-icon in layout).
  // Use existing assets/icons so Android gets the same sharp icon as iOS; 512px avoids blur when scaled.
  const manifest = {
    name: 'Cora',
    short_name: 'Cora',
    id: `${base}/`,
    scope: `${base}/`,
    description: 'A community reporting platform built especially for Orange County!',
    start_url: `${base}/`,
    display: 'standalone' as const,
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'portrait-primary' as const,
    icons: [
      { src: `${base}/assets/icons/apple-touch-icon.png`, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
      { src: `${base}/assets/icons/android-splash-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
      { src: `${base}/assets/icons/apple-touch-icon.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
      { src: `${base}/assets/icons/android-splash-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
