import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
  serverExternalPackages: [
    "googleapis",
    "googleapis-common",
    "google-auth-library",
    "gaxios",
    "gcp-metadata",
    "https-proxy-agent",
    "agent-base",
    "better-sqlite3",
    "node-cron",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  allowedDevOrigins: ['10.100.150.202'],
};

export default nextConfig;
