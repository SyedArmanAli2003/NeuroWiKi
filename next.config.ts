import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native addons and CJS-only packages must not be bundled by webpack
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'mammoth', 'bcryptjs'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
