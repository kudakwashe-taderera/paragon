/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [], // Add any image domains you need here
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
