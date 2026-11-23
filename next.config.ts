import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root. Locally the parent directory may contain a stray lockfile, and without
  // this Turbopack walks up and tries to adopt it. process.cwd() is the project root under both
  // `next build` locally and on Vercel.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
