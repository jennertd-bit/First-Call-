import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@firstcall/ui",
    "@firstcall/types",
    "@firstcall/db",
    "@firstcall/coverage",
    "@firstcall/estimation",
  ],
};

export default nextConfig;
