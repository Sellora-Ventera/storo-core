import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wfthvovlhphnrodrqxqt.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Transpile browser-only ESM packages through webpack
  transpilePackages: ["@react-pdf/renderer"],
  webpack: (config) => {
    // Allow webpack to handle ESM packages in client bundles
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
};

export default nextConfig;
