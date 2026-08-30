import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin explicitly: without this, Turbopack's root inference can pick the
  // parent directory (PR14) instead of this project when launched with a cwd
  // that isn't exactly this folder, which breaks module resolution (e.g.
  // 'tailwindcss') since it then looks one level too high.
  turbopack: {
    root: "D:\\AI\\VibeCodign\\PR14\\PR2_FinancialHub",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
