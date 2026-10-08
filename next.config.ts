import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    cpus: 1,
  },
  typescript: {
    // Independent `npx tsc --noEmit` is run in CI/CD and verification to prevent sub-process memory exhaustion on Windows
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
