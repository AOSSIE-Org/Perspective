import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:locale/analyze',
        destination: '/:locale',
        permanent: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'motion',
      'motion/react',
      'next-intl',
      'recharts',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
  },
};

export default withNextIntl(nextConfig);
