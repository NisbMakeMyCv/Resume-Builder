import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google profile pictures from the Google login flow
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      // UI-Avatars generated profile pictures for email-based accounts
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      // Supabase Storage URLs for uploaded avatars
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
