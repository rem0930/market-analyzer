/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Turbopack root for monorepo resolution in DevContainer
  turbopack: {
    root: `${__dirname}/../../..`,
  },

  // Allow dev origins for worktree subdomains
  allowedDevOrigins: ['*.localhost'],

  // Enable transpile packages from workspace
  transpilePackages: ['@monorepo/api-contract'],

  // Output mode for Docker deployment
  output: 'standalone',

  // Proxy /api requests to the API server (for direct access without Traefik)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:8080/:path*',
      },
    ];
  },

  // Security headers (CSP disabled in development for Mapbox compatibility)
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    if (!isDev) {
      securityHeaders.push({
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
      });
    }

    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
