import type { DetectedFace, LoadedImage, Point, Rect } from "@/types";

/**
 * The stage shows a square "crop" of the photo centred on the selected face.
 * The moving head layer ("wrapper") is rendered larger than the stage (by PAD on each
 * side) so that rotating / shoving it never reveals empty edges.
 */
export const PAD_RATIO = 0.2;

export interface StageGeometry {
  crop: Rect; // visible stage area, image px
  render: Rect; // wrapper area (crop + padding), image px
  /** image px -> % of stage */
  toStage: (p: Point) => Point;
  /** image px -> % of wrapper */
  toWrap: (p: Point) => Point;
  /** image px length -> % of stage width */
  lenStage: (len: number) => number;
  /** image px rect -> % of wrapper */
  rectWrap: (r: Rect) => Rect;
}

export function computeGeometry(img: LoadedImage, face: DetectedFace): StageGeometry {
  const { box } = face;
  const desired = Math.max(box.w, box.h) * 2.3;
  const side = Math.min(desired, Math.max(img.width, img.height));
  const cx0 = box.x + box.w / 2;
  const cy0 = box.y + box.h / 2;
  const clampAxis = (c: number, dim: number) =>
    dim >= side ? Math.min(Math.max(c, side / 2), dim - side / 2) : dim / 2;
  const cx = clampAxis(cx0, img.width);
  const cy = clampAxis(cy0, img.height);
  const crop = { x: cx - side / 2, y: cy - side / 2, w: side, h: side };
  const pad = side * PAD_RATIO;
  const render = { x: crop.x - pad, y: crop.y - pad, w: side + pad * 2, h: side + pad * 2 };

  const toStage = (p: Point) => ({ x: ((p.x - crop.x) / side) * 100, y: ((p.y - crop.y) / side) * 100 });
  const toWrap = (p: Point) => ({ x: ((p.x - render.x) / render.w) * 100, y: ((p.y - render.y) / render.h) * 100 });
  const lenStage = (len: number) => (len / side) * 100;
  const rectWrap = (r: Rect) => {
    const tl = toWrap({ x: r.x, y: r.y });
    return { x: tl.x, y: tl.y, w: (r.w / render.w) * 100, h: (r.h / render.h) * 100 };
  };
  return { crop, render, toStage, toWrap, lenStage, rectWrap };
}

export const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export const rectAround = (c: Point, w: number, h: number): Rect => ({ x: c.x - w / 2, y: c.y - h / 2, w, h });

/** Regions of the face that get "copied" and warped to fake expressions. */
export function featureRegions(face: DetectedFace) {
  const f = face.features;
  const ew = f.eyeWidth;
  const browPatch = (b: Rect, eye: Point): Rect => {
    const x = Math.min(b.x, eye.x - ew * 0.6) - ew * 0.25;
    const right = Math.max(b.x + b.w, eye.x + ew * 0.6) + ew * 0.25;
    const top = b.y - ew * 0.45;
    return { x, y: top, w: right - x, h: eye.y - top };
  };
  return {
    eyeL: rectAround(f.eyeL, ew * 1.9, ew * 1.35),
    eyeR: rectAround(f.eyeR, ew * 1.9, ew * 1.35),
    browL: browPatch(f.browL, f.eyeL),
    browR: browPatch(f.browR, f.eyeR),
    mouth: rectAround({ x: f.mouth.x, y: f.mouth.y + f.mouthWidth * 0.05 }, f.mouthWidth * 1.7, f.mouthWidth * 1.15),
    cheekL: rectAround(f.cheekL, ew * 2.4, ew * 2.4),
    cheekR: rectAround(f.cheekR, ew * 2.4, ew * 2.4),
  };
}
