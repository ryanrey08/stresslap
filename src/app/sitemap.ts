import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// StressLap is a single public page; sections (#how-it-works, #about, #faq) are fragments of it.
// Uploaded photos are local blob: URLs that never reach the server, so there is nothing else to list.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      images: [absoluteUrl("/og-image.png")],
    },
  ];
}
