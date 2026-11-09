/**
 * Site-wide SEO constants and the canonical base URL.
 *
 * NEXT_PUBLIC_SITE_URL is the canonical production origin (https://stresslap.com). Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL, unless a production build was given a localhost or foreign *.vercel.app URL,
 *  2. VERCEL_PROJECT_PRODUCTION_URL (Vercel's production domain, also available in preview builds),
 *  3. http://localhost:3000, which is only ever marked noindex.
 *
 * Preview deployments still point canonical URLs at production, and are themselves noindex
 * (see `isIndexable`), so a preview URL can never be indexed or become canonical.
 */

const DEV_FALLBACK = "http://localhost:3000";
const isProductionBuild = process.env.NODE_ENV === "production";
const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

function parseUrl(raw: string | undefined): URL | null {
  if (!raw?.trim()) return null;
  try {
    return new URL(raw.trim().replace(/\/+$/, ""));
  } catch {
    console.warn(`[site] Ignoring invalid site URL: "${raw}"`);
    return null;
  }
}

/** Reject URLs that must never appear in production metadata. */
function isAllowedInProduction(url: URL): boolean {
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return false;
  if (url.hostname.endsWith(".vercel.app") && vercelProductionHost && url.hostname !== vercelProductionHost) return false;
  return true;
}

function resolveSiteUrl(): { url: URL; configured: boolean } {
  const explicit = parseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit && (!isProductionBuild || isAllowedInProduction(explicit))) return { url: explicit, configured: true };
  if (explicit) console.warn(`[site] Ignoring NEXT_PUBLIC_SITE_URL in production: "${explicit.origin}"`);

  const vercel = parseUrl(vercelProductionHost ? `https://${vercelProductionHost}` : undefined);
  if (vercel) return { url: vercel, configured: true };

  if (isProductionBuild) {
    console.warn("[site] NEXT_PUBLIC_SITE_URL is not set: metadata will use localhost and the site will be marked noindex.");
  }
  return { url: new URL(DEV_FALLBACK), configured: false };
}

const resolved = resolveSiteUrl();

/** Absolute origin used for metadataBase, canonical URLs, sitemap, robots and Open Graph. */
export const siteUrl = resolved.url;

/** Index only real production builds: never previews, Vercel development, or an unconfigured build. */
export const isIndexable = resolved.configured && (process.env.VERCEL_ENV ?? "production") === "production";

/** Google Search Console token (HTML tag method). Unset means no verification tag is rendered. */
export const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;

/** Build an absolute URL on the site. */
export const absoluteUrl = (path = "/") => new URL(path, siteUrl).toString();

export const site = {
  name: "StressLap",
  title: "StressLap – Free Online Face Reaction & Stress Relief Game",
  socialTitle: "StressLap – Release Your Stress, One Slap at a Time!",
  tagline: "Release Your Stress, One Slap at a Time!",
  description:
    "Release your stress with StressLap! Upload a photo, detect a face, and enjoy hilarious slap, punch, and kick animations. Create funny edited photos and download your results for free.",
  appDescription:
    "StressLap is a fun and interactive online stress-relief game where users can upload photos, detect faces, and enjoy entertaining slap, punch, and kick animations with funny facial reactions and visual effects.",
  shortDescription: "A free, cartoon-style stress-relief game: upload a photo and slap, punch or kick it with silly reactions.",
  keywords: [
    "StressLap",
    "online stress relief game",
    "free online slap game",
    "funny face reaction game",
    "interactive face game",
    "online punch game",
    "virtual slap game",
    "face animation game",
    "funny photo effects",
    "interactive photo editor",
    "cartoon slap effects",
    "online kick game",
    "face reaction effects",
    "funny photo generator",
    "free entertainment game",
  ],
  category: "entertainment",
  locale: "en_US",
  language: "en",
  themeColor: "#3b0764",
  backgroundColor: "#1e1b4b",
  /** Bump when the homepage content meaningfully changes (used as the sitemap's lastmod). */
  contentUpdatedAt: "2026-11-09",
  ogImage: { url: "/og-image.png", width: 1200, height: 630, alt: "StressLap logo with the tagline Release Your Stress, One Slap at a Time! next to a cartoon face being slapped, punched and kicked" },
} as const;
