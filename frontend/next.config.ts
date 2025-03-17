import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, 
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Disables type checking errors
  },
  experimental: {
// / Optional:
  },
};

export default nextConfig;
