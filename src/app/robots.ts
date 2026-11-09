import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexable, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    // No production URL configured: keep previews / misconfigured deploys out of search results.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // internal runtime assets (face-detection model + wasm), not content
      disallow: ["/models/", "/mediapipe/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
