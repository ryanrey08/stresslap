/**
 * Generates StressLap favicons, app icons and the Open Graph image from the header logo
 * (yellow "SL" starburst, see src/components/Header.tsx).
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Outputs (committed, so builds do not depend on this script):
 *   public/favicon.ico             16/32/48 px, PNG-in-ICO
 *   public/favicon.svg             scalable favicon for modern browsers
 *   public/icon.png                192x192
 *   public/icon-512.png            512x512
 *   public/icon-maskable-512.png   512x512, full-bleed with safe zone (Android adaptive icons)
 *   public/apple-icon.png          180x180, opaque (iOS ignores transparency)
 *   public/og-image.png            1200x630 social preview
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = path.join(root, "scripts/brand");

// ---- brand tokens (mirrors globals.css / Header.tsx) ----
const YELLOW = "#fde047";
const OUTLINE = "#3b1d0e";
const PINK = "#be185d";
const PURPLE_DARK = "#3b0764";
const PURPLE = "#4c1d95";
const INDIGO = "#1e1b4b";
const STAR = "24,2 29,16 44,12 34,24 46,34 30,32 26,46 20,33 6,40 13,26 2,16 18,16";

const fonts = [
  { name: "Bangers", data: await readFile(path.join(brandDir, "Bangers-Regular.ttf")), weight: 400, style: "normal" },
  { name: "Nunito", data: await readFile(path.join(brandDir, "Nunito-Black.woff")), weight: 900, style: "normal" },
];

const svgUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const starSvg = (stroke = 2.5) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon points="${STAR}" fill="${YELLOW}" stroke="${OUTLINE}" stroke-width="${stroke}" stroke-linejoin="round"/></svg>`;

async function render(element, width, height) {
  const res = new ImageResponse(element, { width, height, fonts });
  return Buffer.from(await res.arrayBuffer());
}

/**
 * The logo mark: starburst + "SL", tilted -12deg like the header.
 * `size` is the mark's box; `textScale` lets tiny favicons use slightly bigger letters.
 */
function logoMark(size, { textScale = 1, stroke = 2.5 } = {}) {
  const fontSize = (13 / 48) * size * textScale;
  return h(
    "div",
    { style: { display: "flex", position: "relative", width: size, height: size, transform: "rotate(-12deg)" } },
    h("img", { src: svgUri(starSvg(stroke)), width: size, height: size, style: { position: "absolute", left: 0, top: 0 } }),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // the header's text baseline sits slightly below centre (y=29 of 48)
          paddingTop: size * 0.03,
          fontFamily: "Nunito",
          fontWeight: 900,
          fontSize,
          letterSpacing: -fontSize * 0.04,
          color: PINK,
        },
      },
      "SL",
    ),
  );
}

const brandBg = `linear-gradient(160deg, ${PURPLE_DARK} 0%, ${PURPLE} 55%, ${INDIGO} 100%)`;

/** Icon on a rounded/opaque brand tile. `pad` = fraction of the tile left around the mark. */
function tileIcon(size, { pad = 0.1, radius = 0.22, textScale = 1 } = {}) {
  const mark = Math.round(size * (1 - pad * 2));
  return h(
    "div",
    {
      style: {
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        background: brandBg,
        borderRadius: size * radius,
      },
    },
    logoMark(mark, { textScale }),
  );
}

/** Transparent favicon: the bare starburst filling the frame. */
function bareIcon(size, textScale) {
  return h(
    "div",
    { style: { display: "flex", width: size, height: size, alignItems: "center", justifyContent: "center" } },
    logoMark(Math.round(size * 1.0), { textScale, stroke: size <= 16 ? 3.5 : 3 }),
  );
}

// ---- favicon.svg (browser renders the text with its own heavy sans, same as the header) ----
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <g transform="rotate(-12 24 24)">
    <polygon points="${STAR}" fill="${YELLOW}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <text x="24" y="29.5" text-anchor="middle" font-size="14.5" font-weight="900" fill="${PINK}" font-family="Nunito, 'Arial Black', 'Helvetica Neue', Arial, sans-serif" letter-spacing="-0.5">SL</text>
  </g>
</svg>
`;

// ---- ICO packing (PNG payloads; supported by every current browser) ----
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, png }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.png)]);
}

// ---- Open Graph image ----
const glyph = {
  hand: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 130"><g stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"><rect x="140" y="30" width="100" height="70" rx="10" fill="#8b5cf6"/><rect x="132" y="26" width="22" height="78" rx="8" fill="#c4b5fd"/><rect x="70" y="2" width="22" height="50" rx="11" fill="#ffd2a6" transform="rotate(-35 81 27)"/><rect x="58" y="22" width="84" height="88" rx="34" fill="#ffd2a6"/><rect x="8" y="28" width="80" height="19" rx="9.5" fill="#ffd2a6"/><rect x="2" y="49" width="86" height="19" rx="9.5" fill="#ffd2a6"/><rect x="8" y="70" width="80" height="19" rx="9.5" fill="#ffd2a6"/><rect x="22" y="91" width="66" height="17" rx="8.5" fill="#ffd2a6"/></g><ellipse cx="102" cy="66" rx="22" ry="26" fill="#ffb98a" opacity="0.6"/></svg>`,
  glove: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 150"><g stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"><rect x="150" y="42" width="100" height="66" rx="10" fill="#38bdf8"/><rect x="128" y="34" width="40" height="82" rx="12" fill="#f8fafc"/><path d="M134 30 C 120 6, 40 0, 18 40 C -2 76, 10 128, 60 140 C 100 150, 132 132, 138 110 Z" fill="#ef4444"/><path d="M120 40 C 110 18, 70 18, 66 40 C 64 58, 104 66, 120 56 Z" fill="#f87171"/></g><path d="M40 46 C 50 30, 70 26, 84 28" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.6"/></svg>`,
  sneaker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150"><g stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"><path d="M150 20 L 258 12 L 258 92 L 160 100 Z" fill="#2563eb"/><rect x="140" y="20" width="30" height="82" rx="8" fill="#f8fafc"/><path d="M150 28 C 120 30, 100 44, 74 54 C 40 64, 10 70, 8 98 C 6 116, 24 122, 50 122 L 160 120 Z" fill="#f97316"/><path d="M4 104 C 6 128, 26 136, 52 136 L 164 134 L 164 116 L 52 120 C 26 120, 8 116, 4 104 Z" fill="#fef3c7"/></g><g stroke="#fff" stroke-width="5" stroke-linecap="round"><line x1="96" y1="50" x2="110" y2="66"/><line x1="112" y1="44" x2="126" y2="60"/><line x1="128" y1="40" x2="140" y2="56"/></g><path d="M48 96 C 80 86, 110 84, 150 90" stroke="#fde68a" stroke-width="8" stroke-linecap="round" fill="none"/></svg>`,
  // a generic cartoon face reacting to a hit (no real person)
  face: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="104" r="84" fill="#ffd2a6" stroke="${OUTLINE}" stroke-width="6"/><ellipse cx="44" cy="126" rx="18" ry="11" fill="#fb7185" opacity="0.6"/><ellipse cx="156" cy="126" rx="18" ry="11" fill="#fb7185" opacity="0.6"/><circle cx="70" cy="86" r="20" fill="#fff" stroke="${OUTLINE}" stroke-width="5"/><circle cx="130" cy="86" r="20" fill="#fff" stroke="${OUTLINE}" stroke-width="5"/><circle cx="74" cy="90" r="8" fill="${OUTLINE}"/><circle cx="126" cy="90" r="8" fill="${OUTLINE}"/><path d="M48 58 L 88 66 M152 58 L 112 66" stroke="${OUTLINE}" stroke-width="6" stroke-linecap="round"/><ellipse cx="100" cy="146" rx="22" ry="26" fill="#7f1d1d" stroke="${OUTLINE}" stroke-width="5"/><ellipse cx="100" cy="158" rx="12" ry="8" fill="#fb7185"/><path d="M178 40 L 192 26 M184 60 L 198 56 M166 24 L 170 8" stroke="${YELLOW}" stroke-width="6" stroke-linecap="round"/></svg>`,
  burst: (fill, inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,2 60,30 90,14 74,42 98,52 70,62 84,92 54,76 44,98 38,70 8,84 26,58 2,42 32,36 18,8 44,26" fill="${fill}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="22" fill="${inner}" opacity="0.85"/></svg>`,
};

const abs = (style) => ({ position: "absolute", display: "flex", ...style });

function ogImage() {
  return h(
    "div",
    {
      style: {
        display: "flex",
        position: "relative",
        width: 1200,
        height: 630,
        overflow: "hidden",
        color: "#fff",
        backgroundColor: PURPLE_DARK,
        backgroundImage: [
          "radial-gradient(circle at 8% 0%, rgba(236,72,153,0.55), rgba(236,72,153,0) 45%)",
          "radial-gradient(circle at 100% 15%, rgba(249,115,22,0.45), rgba(249,115,22,0) 40%)",
          "radial-gradient(circle at 70% 110%, rgba(34,211,238,0.35), rgba(34,211,238,0) 45%)",
          `linear-gradient(160deg, ${PURPLE_DARK} 0%, ${PURPLE} 45%, ${INDIGO} 100%)`,
        ].join(", "),
      },
    },
    // left: brand
    h(
      "div",
      { style: abs({ left: 72, top: 0, height: 630, width: 640, flexDirection: "column", justifyContent: "center" }) },
      h("div", { style: { display: "flex", alignItems: "center", gap: 24 } }, logoMark(150)),
      h(
        "div",
        { style: { display: "flex", fontFamily: "Bangers", fontSize: 150, lineHeight: 1, marginTop: 18, letterSpacing: 3, textShadow: "0 8px 0 rgba(0,0,0,0.3)" } },
        h("span", {}, "Stress"),
        h("span", { style: { color: "#fde047" } }, "Lap"),
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", fontFamily: "Bangers", fontSize: 54, lineHeight: 1.05, letterSpacing: 1.5, color: "#fbcfe8", marginTop: 8 } },
        h("span", {}, "Release Your Stress,"),
        h("span", {}, "One Slap at a Time!"),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 14, marginTop: 30 } },
        ...[
          ["SLAP", "#ec4899"],
          ["PUNCH", "#f97316"],
          ["KICK", "#06b6d4"],
        ].map(([label, bg]) =>
          h(
            "div",
            {
              key: label,
              style: { display: "flex", fontFamily: "Bangers", fontSize: 34, letterSpacing: 2, padding: "8px 26px", borderRadius: 999, backgroundColor: bg, boxShadow: "0 6px 0 rgba(0,0,0,0.3)" },
            },
            label,
          ),
        ),
      ),
    ),
    // right: cartoon scene
    h(
      "div",
      { style: abs({ left: 700, top: 70, width: 460, height: 490, borderRadius: 48, backgroundColor: "#2e1065", border: "6px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }) },
      h("img", { src: svgUri(glyph.burst("#fde047", "#fb7185")), width: 150, height: 150, style: abs({ left: 20, top: 30, transform: "rotate(-10deg)" }) }),
      h("img", { src: svgUri(glyph.burst("#a3e635", "#22d3ee")), width: 110, height: 110, style: abs({ left: 320, top: 330, transform: "rotate(14deg)" }) }),
      h("div", { style: abs({ left: 44, top: 82, fontFamily: "Bangers", fontSize: 40, color: OUTLINE, transform: "rotate(-10deg)" }) }, "POW!"),
      h("img", { src: svgUri(glyph.face), width: 250, height: 250, style: abs({ left: 105, top: 115, transform: "rotate(8deg)" }) }),
      h("img", { src: svgUri(glyph.hand), width: 200, height: 118, style: abs({ left: 300, top: 120, transform: "rotate(-8deg)" }) }),
      h("img", { src: svgUri(glyph.glove), width: 170, height: 111, style: abs({ left: -40, top: 290, transform: "scaleX(-1) rotate(-8deg)" }) }),
      h("img", { src: svgUri(glyph.sneaker), width: 170, height: 98, style: abs({ left: 270, top: 10, transform: "rotate(18deg)" }) }),
    ),
  );
}

// ---- write everything ----
const out = (p) => path.join(root, p);
const icoSizes = [
  [16, 1.25],
  [32, 1.15],
  [48, 1.1],
];
const icoImages = [];
for (const [size, scale] of icoSizes) icoImages.push({ size, png: await render(bareIcon(size, scale), size, size) });

await writeFile(out("public/favicon.ico"), packIco(icoImages));
await writeFile(out("public/favicon.svg"), faviconSvg);
await writeFile(out("public/icon.png"), await render(tileIcon(192), 192, 192));
await writeFile(out("public/icon-512.png"), await render(tileIcon(512), 512, 512));
await writeFile(out("public/icon-maskable-512.png"), await render(tileIcon(512, { pad: 0.2, radius: 0 }), 512, 512));
await writeFile(out("public/apple-icon.png"), await render(tileIcon(180, { pad: 0.08, radius: 0 }), 180, 180));
await writeFile(out("public/og-image.png"), await render(ogImage(), 1200, 630));

console.log("Brand assets written.");
