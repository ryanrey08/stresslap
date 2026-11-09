import type { Metadata, Viewport } from "next";
import { Bangers, Nunito } from "next/font/google";
import { isIndexable, site, siteUrl } from "@/lib/site";
import "./globals.css";

const display = Bangers({ variable: "--font-bangers", weight: "400", subsets: ["latin"], display: "swap" });
const body = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: siteUrl }],
  creator: site.name,
  publisher: site.name,
  category: site.category,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: site.locale,
    images: [{ ...site.ogImage, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [{ url: site.ogImage.url, alt: site.ogImage.alt }],
  },
  robots: isIndexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.language}>
      <body className={`${display.variable} ${body.variable} antialiased`}>{children}</body>
    </html>
  );
}
