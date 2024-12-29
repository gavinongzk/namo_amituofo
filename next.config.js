/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  images: {
    domains: ['utfs.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      }
    ]
  }
}

const sentryWebpackPluginOptions = {
  silent: true,
  org: "gavin-ong",
  project: "javascript-nextjs",
  sourcemaps: {
    deleteSourcemapsAfterUpload: true
  }
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
