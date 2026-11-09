# StressLap SEO and deployment guide

Production site: **https://stresslap.com** (Next.js 15 App Router, hosted on Vercel).

## Where everything lives

| What | File |
| --- | --- |
| Site constants, canonical URL logic, indexing rules | `src/lib/site.ts` |
| Metadata API config (title template, canonical, Open Graph, X, robots, verification) | `src/app/layout.tsx` |
| `themeColor` (lives in `viewport` on Next 15) | `src/app/layout.tsx` |
| `/sitemap.xml` | `src/app/sitemap.ts` |
| `/robots.txt` | `src/app/robots.ts` |
| `/manifest.webmanifest` and `/site.webmanifest` | `src/app/manifest.ts`, rewrite in `next.config.ts` |
| JSON-LD (`WebSite` + `WebApplication`) | `src/components/StructuredData.tsx` |
| Crawlable homepage content | `src/components/InfoSections.tsx` |
| Icons and social image | `public/`, regenerate with `node scripts/generate-brand-assets.mjs` |

When the homepage content meaningfully changes, bump `site.contentUpdatedAt` in `src/lib/site.ts`. It feeds the
sitemap's `lastmod`.

## Vercel environment variables

Set these in Vercel under **Project → Settings → Environment Variables**, then redeploy. Values are read at build time, so a
change has no effect until the next deployment.

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://stresslap.com` | `https://stresslap.com` | leave unset |
| `GOOGLE_SITE_VERIFICATION` | your token | leave unset | leave unset |

How the URL logic behaves:

- A production build ignores `NEXT_PUBLIC_SITE_URL` if it points at localhost or at a `*.vercel.app` host other than the
  project's production host, and falls back to Vercel's `VERCEL_PROJECT_PRODUCTION_URL`.
- Preview deployments keep canonical URLs on stresslap.com and are marked `noindex`, with a `robots.txt` that disallows
  everything. A preview can't be indexed or become canonical.
- A build with no usable URL uses localhost and is marked `noindex`, so localhost URLs can't reach search results.
- `GOOGLE_SITE_VERIFICATION` deliberately has no `NEXT_PUBLIC_` prefix. It only appears in the page as the public
  verification meta tag, which is how Google's method works.

## Vercel domains

Under **Project → Settings → Domains**, keep `stresslap.com` as the primary domain and add `www.stresslap.com` as a redirect
to it. Without that, `www` can resolve in DNS but fail with a certificate error.

## Google Search Console

You can use either method.

**Domain property (recommended, covers `www` and all protocols)**

1. Open <https://search.google.com/search-console> and choose **Add property → Domain**.
2. Enter `stresslap.com`.
3. Add the TXT record Google shows at your DNS provider, then press **Verify**.

**URL prefix property (uses this app's meta tag support)**

1. Choose **Add property → URL prefix** and enter `https://stresslap.com/`.
2. Pick the **HTML tag** method and copy only the `content="..."` value.
3. Set it as `GOOGLE_SITE_VERIFICATION` for the Production environment in Vercel and redeploy.
4. View the page source and confirm `<meta name="google-site-verification" ...>` is present, then press **Verify**.

**Submit the sitemap**

1. In Search Console, open **Indexing → Sitemaps**.
2. Enter `sitemap.xml` and press **Submit**.
3. Use **URL Inspection** on `https://stresslap.com/` and press **Request indexing**.

## Check after each production deployment

```bash
curl -sI https://stresslap.com/ | head -1
curl -s https://stresslap.com/robots.txt
curl -s https://stresslap.com/sitemap.xml
curl -sI https://stresslap.com/favicon.ico | head -1
curl -sI https://stresslap.com/manifest.webmanifest | head -1
curl -sI https://stresslap.com/site.webmanifest | head -1
curl -s https://stresslap.com/ | grep -c -E 'localhost|vercel\.app'
```

The last command should print `0`. These tools cover what `curl` can't:

- Structured data: <https://validator.schema.org> and <https://search.google.com/test/rich-results>
- Facebook and Messenger previews: <https://developers.facebook.com/tools/debug/>
- LinkedIn previews: <https://www.linkedin.com/post-inspector/>
- Performance: <https://pagespeed.web.dev/>

## Decisions worth knowing

- **Title:** the search title is keyword-focused, and social cards use the "Release Your Stress" tagline title.
- **Rich results:** Google's software rich result needs ratings and price offers. StressLap has no real ones, so none are
  claimed and the JSON-LD is descriptive only.
- **No `Organization` schema:** there's no legal publisher identity to describe.
- **Single indexable URL:** the sections are fragments of `/`. Uploaded photos are local `blob:` URLs that never reach a
  server, so they can't be crawled or listed in the sitemap.
- **Blocked paths:** `robots.txt` blocks `/models/` and `/mediapipe/`, which are runtime files rather than content.
  They aren't needed to render the page.
- **Face model loading:** the model and wasm (about 18 MB) now start downloading on the visitor's first interaction rather
  than during page load. Uploading a photo still loads them if they aren't ready.
- **No tracking:** the SEO work adds no analytics or third-party scripts.
- **Image formats:** the page has no raster images to convert. The logo and cartoons are SVG/CSS, and the social image
  stays PNG because that's what crawlers reliably support.
