/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint errors will be fixed post-scaffold; build should not fail on warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
