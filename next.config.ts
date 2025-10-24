import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Webpack configuration to prevent cache corruption issues
  webpack: (config, { isServer, dev }) => {
    // Disable webpack caching during development to prevent corruption
    // This makes builds slightly slower but more reliable
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
