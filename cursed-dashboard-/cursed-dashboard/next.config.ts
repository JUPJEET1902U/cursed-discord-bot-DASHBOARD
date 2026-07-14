import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
  // Dashboard never imports or runs the bot process. Feature writes remain
  // gated until the live bot and dashboard share the same schema contract.
};

export default nextConfig;
