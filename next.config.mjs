/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configure file upload handling
  serverExternalPackages: ['sharp'],
  // Configure experimental features
  experimental: {
    // Add any experimental features here if needed
  },
}

export default nextConfig