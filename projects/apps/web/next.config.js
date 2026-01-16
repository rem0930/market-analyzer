/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Enable transpile packages from workspace
  transpilePackages: ['@monorepo/api-contract'],

  // Output mode for Docker deployment
  output: 'standalone',
};

module.exports = nextConfig;
