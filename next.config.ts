import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [{
      source: "/cookiecapes/account/:path*",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
      ],
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'crafthead.net',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
