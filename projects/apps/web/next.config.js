/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Enable transpile packages from workspace
  transpilePackages: ['@monorepo/api-contract'],

  // Experimental features
  experimental: {
    // Enable typed routes
    typedRoutes: true,
  },
};

module.exports = nextConfig;
