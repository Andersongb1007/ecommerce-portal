import type { NextConfig } from 'next';
import { env } from './src/lib/validation/env';

const apiUrl = env.NEXT_PUBLIC_API_URL;
const cspHeader = `
  default-src 'self';
  connect-src 'self' ${apiUrl} http://localhost:3001 http://127.0.0.1:3001;
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: ${apiUrl} http://localhost:3001 http://127.0.0.1:3001;
  font-src 'self';
  object-src 'none';
  frame-src 'self' ${apiUrl} http://localhost:3001 http://127.0.0.1:3001;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
