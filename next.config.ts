import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dev",
        destination: "/development",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
