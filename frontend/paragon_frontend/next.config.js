/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // Required for cPanel Node.js setup
  basePath: process.env.NODE_ENV === 'production' ? '/frontend' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/frontend' : ''
}

module.exports = nextConfig 