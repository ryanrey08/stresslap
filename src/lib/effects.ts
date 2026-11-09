/**
 * Permanent cartoon effects (slap marks, bruises, sneaker prints).
 *
 * Effects are stored in ORIGINAL IMAGE PIXELS, independent of how the stage crops the photo,
 * and drawn with the Canvas 2D API. The same draw code produces both the live preview
 * composite and the full-resolution PNG export, so the download matches what the user sees.
 * Everything runs locally: the photo is a same-origin blob: URL, so the canvas is never tainted.
 */
import type { ActionType, DetectedFace, LoadedImage, Point, Side } from "@/types";
import { lerp } from "./geometry";

export interface PersistentEffect {
  id: number;
  type: ActionType;
  side: Side;
  /** Face the effect was applied to. */
  faceId: number;
  /** Centre, in original image pixels. */
  x: number;
  y: number;
  /** Diameter of the effect, in original image pixels. */
  size: number;
  /** Degrees, clockwise. */
  rotation: number;
  /** 1 = as authored, -1 = mirrored horizontally. */
  mirror: 1 | -1;
  /** 0..1, overall strength of the stain colours. */
  opacity: number;
  /** Small integer picking a look variation. */
  variant: number;
  /** Seed for per-effect randomness (wobbly bruise outline, etc.). */
  seed: number;
  createdAt: number;
}

export function seeded(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Where on the face an action connects, in image pixels. Mirrors `hitPoint` in FacePreview. */
export function hitPointImg(type: ActionType, side: Side, face: DetectedFace): Point {
  const f = face.features;
  const cheek = side === "right" ? f.cheekR : f.cheekL;
  // marks sit a touch further in than where the hand lands, so they stay on the face
  if (type === "slap") return lerp(cheek, f.nose, 0.15);
  if (type === "punch") return lerp(f.nose, cheek, 0.6);
  return lerp(lerp(f.chin, cheek, 0.45), f.mouth, 0.2);
}

const SIZE_FACTOR: Record<ActionType, number> = { slap: 0.4, punch: 0.27, kick: 0.36 };

/**
 * Builds a new effect near `base`, nudging it so it overlaps existing marks as little as possible.
 */
export function createEffect(
  id: number,
  type: ActionType,
  side: Side,
  face: DetectedFace,
  base: Point,
  existing: PersistentEffect[],
): PersistentEffect {
  const seed = id * 7919 + Math.floor(Math.random() * 100000);
  const rand = seeded(seed);
  const size = face.box.w * SIZE_FACTOR[type] * (0.9 + rand() * 0.2);
  const r = size / 2;
  const maxShift = face.box.w * 0.15;

  // Candidate spots: the hit point first, then a spiral around it.
  const candidates: Point[] = [base];
  for (let i = 1; i <= 16; i++) {
    const a = i * 2.4 + rand() * 0.5;
    const d = maxShift * Math.sqrt(i / 16);
    candidates.push({ x: base.x + Math.cos(a) * d, y: base.y + Math.sin(a) * d * 0.8 });
  }
  const { box } = face;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const score = (p: Point) => {
    const overlap = existing.reduce((sum, e) => sum + Math.max(0, (r + e.size / 2) * 0.75 - Math.hypot(p.x - e.x, p.y - e.y)), 0);
    // keep marks on the face oval instead of spilling onto the background
    const outside = Math.max(0, Math.hypot((p.x - cx) / (box.w / 2), (p.y - cy) / (box.h / 2)) + (r / box.w) * 0.6 - 1);
    return overlap + outside * box.w * 1.5 + Math.hypot(p.x - base.x, p.y - base.y) * 0.15; // slight preference for the true hit spot
  };
  const best = candidates.reduce((a, b) => (score(b) < score(a) ? b : a));

  const mirror: 1 | -1 = side === "left" ? -1 : 1;
  const tilt = type === "slap" ? 18 : type === "kick" ? 25 : 0;
  return {
    id,
    type,
    side,
    faceId: face.id,
    x: best.x,
    y: best.y,
    size,
    rotation: face.roll + mirror * tilt + (rand() - 0.5) * 24,
    mirror,
    opacity: 0.85 + rand() * 0.15,
    variant: Math.floor(rand() * 3),
    seed,
    createdAt: Date.now(),
  };
}

/* ---------------- drawing ---------------- */

type Ctx = CanvasRenderingContext2D;

/** Clockwise rounded rect as SVG path data (same winding everywhere, so one fill never doubles up). */
function rrD(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
}
/** Clockwise ellipse rotated by `deg`. */
function ellipseD(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a) * rx;
  const dy = Math.sin(a) * rx;
  return `M${cx - dx},${cy - dy}A${rx},${ry} ${deg} 1 1 ${cx + dx},${cy + dy}A${rx},${ry} ${deg} 1 1 ${cx - dx},${cy - dy}Z`;
}

// Authored in a 100x100 box centred on 0,0, fingers pointing up, thumb on the left.
const HAND_D = [
  rrD(-21, -6, 42, 42, 15),
  rrD(-22, -42, 10, 42, 5),
  rrD(-10.5, -48, 10, 48, 5),
  rrD(1, -46, 10, 46, 5),
  rrD(12.5, -38, 9.5, 38, 4.75),
  ellipseD(-27, 12, 18, 5.5, -55),
].join("");

const SOLE_D = [ellipseD(0, -20, 19, 25, 0), ellipseD(0, 27, 14, 16, 0), rrD(-14, -12, 28, 38, 6)].join("");

let handPath: Path2D | null = null;
let solePath: Path2D | null = null;
const getHand = () => (handPath ??= new Path2D(HAND_D));
const getSole = () => (solePath ??= new Path2D(SOLE_D));

function radial(ctx: Ctx, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function drawSlap(ctx: Ctx, e: PersistentEffect) {
  const a = e.opacity;
  // swollen, rosy cheek
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = radial(ctx, 58, [
    [0, `rgba(244,63,94,${0.55 * a})`],
    [0.6, `rgba(251,113,133,${0.3 * a})`],
    [1, "rgba(251,113,133,0)"],
  ]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  // the cartoon handprint
  ctx.fillStyle = `rgba(220,38,38,${0.55 * a})`;
  ctx.fill(getHand());
  ctx.strokeStyle = `rgba(153,27,27,${0.45 * a})`;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.stroke(getHand());
  // puffy shine = swelling
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = radial(ctx, 16, [
    [0, `rgba(255,255,255,${0.32 * a})`],
    [1, "rgba(255,255,255,0)"],
  ]);
  ctx.save();
  ctx.translate(-14, -14);
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // little "sting" lines
  ctx.strokeStyle = `rgba(220,38,38,${0.8 * a})`;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const ang = -0.9 + i * 0.45;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 50, Math.sin(ang) * 50);
    ctx.lineTo(Math.cos(ang) * 62, Math.sin(ang) * 62);
    ctx.stroke();
  }
}

function blobPath(rand: () => number, r: number) {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2;
    const rr = r * (0.82 + rand() * 0.3);
    return { x: Math.cos(ang) * rr, y: Math.sin(ang) * rr };
  });
  const p = new Path2D();
  const mid = (i: number) => {
    const a = pts[i % n];
    const b = pts[(i + 1) % n];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  const m0 = mid(0);
  p.moveTo(m0.x, m0.y);
  for (let i = 1; i <= n; i++) {
    const c = pts[i % n];
    const m = mid(i);
    p.quadraticCurveTo(c.x, c.y, m.x, m.y);
  }
  p.closePath();
  return p;
}

function drawPunch(ctx: Ctx, e: PersistentEffect) {
  const a = e.opacity;
  const rand = seeded(e.seed);
  const outer = blobPath(rand, 46);
  const inner = blobPath(rand, 26);
  ctx.globalCompositeOperation = "multiply";
  // yellow-green cartoon rim, then purple core
  ctx.fillStyle = radial(ctx, 50, [
    [0, `rgba(109,40,217,${0.6 * a})`],
    [0.55, `rgba(99,102,241,${0.45 * a})`],
    [0.82, `rgba(190,242,100,${0.35 * a})`],
    [1, "rgba(190,242,100,0)"],
  ]);
  ctx.fill(outer);
  ctx.fillStyle = `rgba(88,28,135,${0.45 * a})`;
  ctx.fill(inner);
  ctx.strokeStyle = `rgba(76,29,149,${0.5 * a})`;
  ctx.lineWidth = 2.5;
  ctx.stroke(inner);
  // shiny lump highlight
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(255,255,255,${0.7 * a})`;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 17, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.75 * a})`;
  ctx.beginPath();
  ctx.arc(-6, -15, 2.6, 0, Math.PI * 2);
  ctx.fill();
  if (e.variant === 0) drawBandAidCross(ctx, 26, -26, 0.55, a);
}

function drawBandAid(ctx: Ctx, a: number) {
  ctx.beginPath();
  ctx.roundRect?.(-30, -9, 60, 18, 9);
  if (!ctx.roundRect) ctx.rect(-30, -9, 60, 18);
  ctx.fillStyle = `rgba(245,201,154,${a})`;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(59,29,14,${a})`;
  ctx.stroke();
  ctx.fillStyle = `rgba(222,160,110,${a})`;
  ctx.fillRect(-10, -6, 20, 12);
  ctx.fillStyle = `rgba(59,29,14,${0.5 * a})`;
  for (const [x, y] of [[-20, -3], [-20, 3], [20, -3], [20, 3], [-25, 0], [25, 0]]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBandAidCross(ctx: Ctx, x: number, y: number, scale: number, a: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(Math.PI / 4);
  drawBandAid(ctx, a);
  ctx.rotate(-Math.PI / 2);
  drawBandAid(ctx, a);
  ctx.restore();
}

function drawKick(ctx: Ctx, e: PersistentEffect) {
  const a = e.opacity;
  // reddish bump under the print
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = radial(ctx, 55, [
    [0, `rgba(239,68,68,${0.4 * a})`],
    [0.7, `rgba(251,146,60,${0.2 * a})`],
    [1, "rgba(251,146,60,0)"],
  ]);
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fill();
  // dusty sneaker sole
  const sole = getSole();
  ctx.fillStyle = `rgba(120,98,82,${0.5 * a})`;
  ctx.fill(sole);
  ctx.save();
  ctx.clip(sole);
  ctx.strokeStyle = `rgba(41,37,36,${0.5 * a})`;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = "round";
  for (let y = -44; y <= 44; y += 9) {
    ctx.beginPath();
    for (let x = -22, i = 0; x <= 22; x += 6, i++) ctx.lineTo(x, y + (i % 2 ? 3 : -3));
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = `rgba(41,37,36,${0.55 * a})`;
  ctx.lineWidth = 2.5;
  ctx.stroke(sole);
  // cartoon touch: band-aids or a tiny lump shine
  if (e.variant !== 2) drawBandAidCross(ctx, 30 * (e.variant === 0 ? 1 : -1), 32, 0.6, a);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(255,255,255,${0.55 * a})`;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 50, Math.PI * 1.15, Math.PI * 1.35);
  ctx.stroke();
}

/** Draws effects onto a context whose coordinate system is ORIGINAL IMAGE PIXELS. */
export function drawEffects(ctx: Ctx, effects: PersistentEffect[]) {
  for (const e of effects) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate((e.rotation * Math.PI) / 180);
    const s = e.size / 100;
    ctx.scale(s * e.mirror, s);
    if (e.type === "slap") drawSlap(ctx, e);
    else if (e.type === "punch") drawPunch(ctx, e);
    else drawKick(ctx, e);
    ctx.restore();
  }
  ctx.globalCompositeOperation = "source-over";
}

/** Largest canvas most mobile browsers allow (iOS Safari caps at ~16.7 MP). */
const MAX_CANVAS_AREA = 16_000_000;
const MAX_CANVAS_SIDE = 8192;

export function exportScale(img: LoadedImage, maxSide = MAX_CANVAS_SIDE) {
  const bySide = maxSide / Math.max(img.width, img.height);
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (img.width * img.height));
  return Math.min(1, bySide, byArea);
}

/** Layer 1 (original photo) + layer 2 (permanent effects), flattened onto one canvas. */
export function renderComposite(base: HTMLImageElement, img: LoadedImage, effects: PersistentEffect[], maxSide?: number) {
  const scale = exportScale(img, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
  ctx.scale(canvas.width / img.width, canvas.height / img.height);
  drawEffects(ctx, effects);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), type, quality),
  );
}

export function loadImageEl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Image failed to load"));
    el.src = url;
  });
}

export function finalImageFilename(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `stresslap-final-result-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.png`;
}
