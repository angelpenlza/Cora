import type { NextConfig } from "next";

/**
 * Next.js application configuration for Cora.
 *
 * - Exposes the PWA manifest at `/manifest.json` via a rewrite to the API route.
 * - Adds explicit headers for `manifest.json` and `sw.js` so browsers treat them
 *   as a web app manifest and service worker script respectively.
 */
const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  // Upload form sends images via Server Actions; default body limit (~1 MB) causes 413 on typical photos.
  // Keep at or below Vercel's serverless request body cap (~4.5 MB).
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
  },
  async rewrites() {
    // Serve the generated manifest from the API route while keeping the public URL stable.
    return [{ source: '/manifest.json', destination: '/api/manifest' }];
  },
  async headers() {
    const sharedHeaders = [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];

    if (process.env.NODE_ENV !== 'production') {
      return sharedHeaders;
    }

    return [
      ...sharedHeaders,
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
