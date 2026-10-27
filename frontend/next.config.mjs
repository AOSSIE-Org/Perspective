import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export for GitHub Pages; the app talks to the FastAPI backend from the browser.
  output: 'export',
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
