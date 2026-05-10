import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pdf-parse/**/*"],
  },
};

export default nextConfig;
