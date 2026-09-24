import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hvac/shared"],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
