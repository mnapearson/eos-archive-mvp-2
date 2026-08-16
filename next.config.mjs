/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@supabase/auth-helpers-nextjs',
    '@supabase/auth-helpers-shared',
    '@supabase/supabase-js',
  ],
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
      { protocol: 'https', hostname: '*.squarespace-cdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'static1.squarespace.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'www.filepicker.io', pathname: '/**' },
      { protocol: 'https', hostname: '*.myshopify.com', pathname: '/**' },
      { protocol: 'https', hostname: 'format.creatorcdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'api.mapbox.com', pathname: '/**' },
      { protocol: 'https', hostname: 'static.wixstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.prismic.io', pathname: '/**' },
      { protocol: 'https', hostname: 'freight.cargo.site', pathname: '/**' },
      { protocol: 'https', hostname: '*.digitaloceanspaces.com', pathname: '/**' },
      // Sync stores each space's hero image as a direct link to the venue's
      // own site (og:image), so new hostnames appear every time a space is
      // added — a fixed allowlist alone can't keep up. Catch-all for any
      // remaining HTTPS host until the sync re-hosts images in Supabase
      // Storage instead (see hero image follow-up).
      { protocol: 'https', hostname: '**', pathname: '/**' },
    ],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
