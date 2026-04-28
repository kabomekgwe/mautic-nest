import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@mautic-nest/shared'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
