import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
  // Dashboard never talks to the bot process directly — only via the API
  // routes in src/app/api/*, which in turn read/write MongoDB. Keep it that way.
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
