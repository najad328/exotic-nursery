import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: [
    "@exotic-nursery/types",
    "@exotic-nursery/utils",
    "@exotic-nursery/supabase",
  ],
};

export default nextConfig;
