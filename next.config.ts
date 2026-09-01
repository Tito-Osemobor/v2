import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.E2E_TEST === "1" ? ".next-e2e" : ".next",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    typedEnv: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
