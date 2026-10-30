import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Content-Security-Policy is per-request (nonce) and lives in src/proxy.ts.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Google sign-in and XPay checkout are full-page redirects, never pop-ups: no window is shared.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Providers' own resized images (see the loader); never the Vercel optimizer.
    loader: 'custom',
    loaderFile: './src/lib/images/loader.ts',
  },
  experimental: {
    // Builds compile from scratch: the build cache Vercel restores served a stale stylesheet
    // (the old light theme) after globals.css changed. A full build takes under a minute.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // The on-device OCR's engine and model (public/ocr, ~8 MB): versioned with the app, cached for a year.
      {
        source: '/ocr/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
