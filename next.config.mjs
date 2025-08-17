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
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Increase body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

export default nextConfig