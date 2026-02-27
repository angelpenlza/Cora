import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;

  // Android/Chrome splash: uses background_color + theme_color + 512px PNG icon + name.
  // 512 icon is from scripts/generate-all-splash.mjs (android-splash-512x512) to match iOS branding.
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
      { src: `${base}/assets/web-app-manifest-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
      { src: `${base}/assets/android-splash-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
      { src: `${base}/assets/web-app-manifest-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
      { src: `${base}/assets/android-splash-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
