/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      }
    ],
    path: '/img/_next',
    loader: 'default',
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  },
  eslint: {
    // Build speed: don't run ESLint as part of `next build`.
    // Keep it as a separate step via `pnpm lint` (or in CI).
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Ignore TypeScript errors during build to speed up deployment
  },
  // Optimize build performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons', 
      'lucide-react',
      'chart.js',
      'framer-motion',
      'googleapis',
      'jspdf'
    ],
  },
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize webpack
  webpack: (config, { dev, isServer }) => {
    // Add path aliases for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/lib': require('path').resolve(__dirname, 'lib'),
      '@/types': require('path').resolve(__dirname, 'types'),
      '@/constants': require('path').resolve(__dirname, 'constants'),
    };



    // Optimize for production builds
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          // Separate large dependencies into their own chunks
          chartjs: {
            test: /[\\/]node_modules[\\/]chart\.js[\\/]/,
            name: 'chartjs',
            chunks: 'all',
            priority: 20,
          },
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer',
            chunks: 'all',
            priority: 20,
          },
          google: {
            test: /[\\/]node_modules[\\/]googleapis[\\/]/,
            name: 'google',
            chunks: 'all',
            priority: 20,
          },
          jspdf: {
            test: /[\\/]node_modules[\\/]jspdf[\\/]/,
            name: 'jspdf',
            chunks: 'all',
            priority: 20,
          },
        },
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/img/_next/:path*',
        destination: '/_next/image/:path*'
      },
      {
        source: '/api/cancel-registration',
        destination: '/api/cancel-registration'
      }
    ]
  }
}

module.exports = nextConfig


// Temporarily disabled Sentry to debug build issues
// Injected content via Sentry wizard below

// const { withSentryConfig } = require("@sentry/nextjs");

// module.exports = withSentryConfig(
//   module.exports,
//   {
//     // For all available options, see:
//     // https://github.com/getsentry/sentry-webpack-plugin#options

//     org: "namo-amituofo",
//     project: "javascript-nextjs",

//     // Only print logs for uploading source maps in CI
//     silent: !process.env.CI,

//     // For all available options, see:
//     // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

//     // Upload a larger set of source maps for prettier stack traces (increases build time)
//     widenClientFileUpload: true,

//     // Automatically annotate React components to show their full name in breadcrumbs and session replay
//     reactComponentAnnotation: {
//       enabled: true,
//     },

//     // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
//     // This can increase your server load as well as your hosting bill.
//     // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
//     // side errors will fail.
//     tunnelRoute: "/monitoring",

//     // Configure error handling
//     errorHandling: {
//       enabled: true,
//       ignoreErrors: [
//         // Ignore network errors that might be caused by ad blockers or offline state
//         'Failed to fetch',
//         'NetworkError',
//         'TypeError: Failed to fetch',
//         'ChunkLoadError',
//       ],
//     },

//     // Hides source maps from generated client bundles
//     hideSourceMaps: true,

//     // Automatically tree-shake Sentry logger statements to reduce bundle size
//     disableLogger: true,

//     // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
//     // See the following for more information:
//     // https://docs.sentry.io/product/crons/
//     // https://vercel.com/docs/cron-jobs
//     automaticVercelMonitors: true,
//   }
// );
