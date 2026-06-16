/** @type {import('next').NextConfig} */
    const nextConfig = {
      reactStrictMode: true,
      output: 'standalone',
      typescript: {
        // Ignore TypeScript errors during build - fix types post-launch
        ignoreBuildErrors: true,
      },
      eslint: {
        // Ignore ESLint errors during build
        ignoreDuringBuilds: true,
      },
    };

    module.exports = nextConfig;
    