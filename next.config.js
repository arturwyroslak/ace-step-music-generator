/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for API routes
  experimental: {
    // Enable server actions if needed
  },
}

module.exports = nextConfig
