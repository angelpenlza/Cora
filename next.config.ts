import { Protocol } from "@aws-sdk/client-s3";
import type { NextConfig } from "next";
import { hostname } from "os";

const nextConfig: NextConfig = {
  async rewrites() {
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
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Service-Worker-Allowed', value: '/' },
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
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
