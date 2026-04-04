import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self'; connect-src 'self' https://api.stripe.com https://api.unsplash.com; frame-src 'self' https://js.stripe.com"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
