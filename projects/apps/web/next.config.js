/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Allow dev origins for worktree subdomains
  allowedDevOrigins: ['*.localhost'],

  // Enable transpile packages from workspace
  transpilePackages: ['@monorepo/api-contract'],

  // Output mode for Docker deployment
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              "img-src 'self' data: blob: https://*.mapbox.com",
              "connect-src 'self' https://*.mapbox.com https://api.mapbox.com https://events.mapbox.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "font-src 'self' data:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
