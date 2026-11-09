import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // One manifest (src/app/manifest.ts), reachable at both conventional URLs.
    return [{ source: "/site.webmanifest", destination: "/manifest.webmanifest" }];
  },
  async headers() {
    // The face model and wasm runtime are large and rarely change.
    const cacheControl = "public, max-age=604800, stale-while-revalidate=2592000";
    return [
      { source: "/models/:path*", headers: [{ key: "Cache-Control", value: cacheControl }] },
      { source: "/mediapipe/:path*", headers: [{ key: "Cache-Control", value: cacheControl }] },
    ];
  },
};

export default nextConfig;
