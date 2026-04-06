import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    // Disable image optimization for uploaded files in production (Vercel limitation)
    unoptimized: process.env.VERCEL ? true : false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Allow loading from localhost in development
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
    ],
  },

  // Security Headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking protection
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // MIME type sniffing protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // HSTS (for HTTPS - production only)
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }] : []),
          // Permissions policy (formerly Feature-Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' https: data:; font-src 'self' https:; connect-src 'self' https://api.stripe.com https://api.unsplash.com https://cdn.jsdelivr.net; frame-src 'self' https://js.stripe.com"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
