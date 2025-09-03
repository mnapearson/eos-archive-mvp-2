/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Keep the exact Supabase host you already use and allow common CDNs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mqtcodpajykyvodmahlt.supabase.co',
        pathname: '/storage/v1/**',
      },
      { protocol: 'https', hostname: '*.fbcdn.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.cdninstagram.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
