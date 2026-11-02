import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export for GitHub Pages; the app talks to the FastAPI backend from the browser.
  output: 'export',
  // Pin the workspace root to this folder so a stray lockfile in a parent directory is not picked up.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
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
