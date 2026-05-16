import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
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
  async redirects() {
    // UUID v4-shape (any version) — match only UUID-like segments to avoid
    // catching static account paths like /dashboard/stores, /dashboard/billing.
    const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
    return [
      // Orphaned per-store communication routes → cross-store + filter
      {
        source: `/dashboard/:storeId(${UUID})/messages`,
        destination: "/dashboard/messages?store=:storeId",
        permanent: false,
      },
      {
        source: `/dashboard/:storeId(${UUID})/notifications`,
        destination: "/dashboard/notifications?store=:storeId",
        permanent: false,
      },
      {
        source: `/dashboard/:storeId(${UUID})/leads`,
        destination: "/dashboard/leads?store=:storeId",
        permanent: false,
      },
      // Per-store admin moved under /manage-store/ — catch-all backward-compat
      {
        source: `/dashboard/:storeId(${UUID})/:path*`,
        destination: "/dashboard/manage-store/:storeId/:path*",
        permanent: false,
      },
      {
        source: `/dashboard/:storeId(${UUID})`,
        destination: "/dashboard/manage-store/:storeId",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
