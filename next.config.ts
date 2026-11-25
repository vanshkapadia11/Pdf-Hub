import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Heavy native / ESM-only packages are kept external so they are loaded
  // with plain Node semantics at runtime instead of being bundled.
  serverExternalPackages: [
    "pdfjs-dist",
    "@napi-rs/canvas",
    "sharp",
    "pdf-lib",
    "docx",
    "exceljs",
    "jszip",
  ],
  eslint: {
    ignoreDuringBuilds: false,
  },
  async redirects() {
    return [
      // The dashboard was folded into the home page; keep old links working.
      { source: "/dashboard", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
