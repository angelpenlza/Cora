import type { NextConfig } from "next";

/**
 * Next.js application configuration for Cora.
 *
 * - Exposes the PWA manifest at `/manifest.json` via a rewrite to the API route.
 * - Adds explicit headers for `manifest.json` and `sw.js` so browsers treat them
 *   as a web app manifest and service worker script respectively.
 */
const nextConfig: NextConfig = {
  // Upload form sends images via Server Actions; default body limit (~1 MB) causes 413 on typical photos.
  // Keep at or below Vercel’s serverless request body cap (~4.5 MB).
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
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          // Ensure the service worker is served as JavaScript and is not cached aggressively;
          // this allows updates to take effect quickly during development and deployments.
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          // Allow the worker to control the entire origin (`/`) instead of just `/sw.js`'s path.
          { key: 'Service-Worker-Allowed', value: '/' },
          // Keep the SW script extremely locked down; it runs in a powerful context.
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  images: {
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
        pathname: '/**'
      },
    ],
  },
};

export default nextConfig;
