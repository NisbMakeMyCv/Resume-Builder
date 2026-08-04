import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev indicator (the "next" badge in the bottom-left).
  devIndicators: false,
  output: "standalone",
};

export default nextConfig;
