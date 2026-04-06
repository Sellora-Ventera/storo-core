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
        hostname: "lovable.dev",
      },
    ],
  },
};

export default nextConfig;
