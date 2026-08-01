import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit", "@signpdf/signpdf", "@signpdf/signer-p12"],
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
