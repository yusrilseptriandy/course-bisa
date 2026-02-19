import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns: [new URL("https://26bc19sene.ufs.sh/**")]
  }
};

export default nextConfig;
