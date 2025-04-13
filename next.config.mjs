import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'images-na.ssl-images-amazon.com', 'i5.walmartimages.com'],
    // Enable image optimization
    unoptimized: false,
    // Configure image loader for CDN
    loader: 'default',
    // Configure image formats with priority order
    formats: ['image/avif', 'image/webp', 'image/png', 'image/jpeg'],
    // Configure image caching
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    // Configure image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable remote patterns for CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      }
    ],
  },
  // Enable compression
  compress: true,
  // Enable static optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'recharts', 'lucide-react'],
    // Enable modern JavaScript features
    legacyBrowsers: false,
    // Enable React Server Components
    serverComponents: true,
    // Enable App Directory
    appDir: true,
  },
  // Configure headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          },
        ],
      },
    ];
  },
  // Configure redirects for CDN
  async rewrites() {
    return {
      beforeFiles: [
        // Add CDN rewrites for static assets
        {
          source: '/static/:path*',
          destination: process.env.NEXT_PUBLIC_CDN_URL ? `${process.env.NEXT_PUBLIC_CDN_URL}/static/:path*` : '/static/:path*',
        },
        // Add CDN rewrites for images
        {
          source: '/images/:path*',
          destination: process.env.NEXT_PUBLIC_CDN_URL ? `${process.env.NEXT_PUBLIC_CDN_URL}/images/:path*` : '/images/:path*',
        },
      ],
    };
  },
  // Configure webpack for better optimization
  webpack: (config, { dev, isServer }) => {
    // Enable terser minification in production
    if (!dev && !isServer) {
      config.optimization.minimize = true;
    }
    
    // Add module rules for optimizing images
    config.module.rules.push({
      test: /\.(jpe?g|png|svg|gif|ico|webp|avif)$/,
      use: [
        {
          loader: 'image-optimization-loader',
          options: {
            mozjpeg: {
              quality: 80,
            },
            optipng: {
              optimizationLevel: 3,
            },
            pngquant: {
              quality: [0.65, 0.90],
              speed: 4,
            },
            webp: {
              quality: 85,
            },
          },
        },
      ],
    });

    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})(nextConfig) 