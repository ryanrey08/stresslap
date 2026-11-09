/**
 * Site-wide SEO constants and the canonical base URL.
 *
 * Set NEXT_PUBLIC_SITE_URL (e.g. https://stresslap.com) for production builds. Without it:
 *  - `next dev` uses http://localhost:3000,
 *  - Vercel builds fall back to the project's production domain,
 *  - any other production build falls back to localhost but is marked noindex (see `isIndexable`),
 *    so a misconfigured deploy never gets indexed with localhost URLs.
 */

const DEV_FALLBACK = "http://localhost:3000";

function resolveSiteUrl(): { url: URL; configured: boolean } {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const raw = explicit || (vercel ? `https://${vercel}` : "");
  if (raw) {
    try {
      return { url: new URL(raw.replace(/\/+$/, "")), configured: true };
    } catch {
      console.warn(`[site] Ignoring invalid NEXT_PUBLIC_SITE_URL: "${raw}"`);
    }
  }
  if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    console.warn("[site] NEXT_PUBLIC_SITE_URL is not set: metadata will use localhost and the site will be marked noindex.");
  }
  return { url: new URL(DEV_FALLBACK), configured: false };
}

const resolved = resolveSiteUrl();

/** Absolute origin used for metadataBase, canonical URLs, sitemap, robots and Open Graph. */
export const siteUrl = resolved.url;

/** Only allow indexing when a real production URL is configured. */
export const isIndexable = resolved.configured;

/** Build an absolute URL on the site. */
export const absoluteUrl = (path = "/") => new URL(path, siteUrl).toString();

export const site = {
  name: "StressLap",
  title: "StressLap – Release Your Stress, One Slap at a Time!",
  tagline: "Release Your Stress, One Slap at a Time!",
  description:
    "StressLap is a fun, interactive online stress-relief game where you can upload a photo, detect a face, and enjoy hilarious slap, punch, and kick animations with entertaining facial reactions and effects.",
  shortDescription: "A free, cartoon-style stress-relief game: upload a photo and slap, punch or kick it with silly reactions.",
  keywords: [
    "StressLap",
    "online stress relief game",
    "interactive face game",
    "funny slap game",
    "virtual slap game",
    "online punch game",
    "kick animation game",
    "face reaction game",
    "free online entertainment game",
    "interactive photo game",
  ],
  category: "entertainment",
  locale: "en_US",
  language: "en",
  themeColor: "#3b0764",
  backgroundColor: "#1e1b4b",
  ogImage: { url: "/og-image.png", width: 1200, height: 630, alt: "StressLap logo with the tagline Release Your Stress, One Slap at a Time! next to a cartoon face being slapped, punched and kicked" },
} as const;
