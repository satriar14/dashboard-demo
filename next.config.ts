import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
