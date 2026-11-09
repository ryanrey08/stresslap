"use client";

import type { FaceLandmarker as FaceLandmarkerType, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { DetectedFace, Point, Rect } from "@/types";

/**
 * Browser-only face detection built on MediaPipe Face Landmarker.
 * The WASM runtime and the model are served from this app's /public folder,
 * so the photo is processed locally and never sent anywhere.
 */

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/models/face_landmarker.task";
const MAX_FACES = 6;

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;

/** MediaPipe logs routine "INFO:" lines through console.error; keep the console clean. */
async function quietly<T>(fn: () => Promise<T> | T): Promise<T> {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && /^(INFO|W\d+|I\d+):?/.test(args[0])) return;
    original(...args);
  };
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

export function loadFaceLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = quietly(async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
        runningMode: "IMAGE",
        numFaces: MAX_FACES,
        minFaceDetectionConfidence: 0.45,
        minFacePresenceConfidence: 0.45,
      });
    }).catch((err) => {
      landmarkerPromise = null; // allow retry
      throw err;
    });
  }
  return landmarkerPromise;
}

// Face-mesh landmark indices (image-left = subject's right side).
const IDX = {
  eyeLOuter: 33,
  eyeLInner: 133,
  eyeLRing: [33, 160, 158, 133, 153, 144],
  eyeRInner: 362,
  eyeROuter: 263,
  eyeRRing: [362, 385, 387, 263, 373, 380],
  browL: [70, 63, 105, 66, 107, 46, 53, 52, 65, 55],
  browR: [300, 293, 334, 296, 336, 276, 283, 282, 295, 285],
  mouthLeft: 61,
  mouthRight: 291,
  lipTop: 13,
  lipBottom: 14,
  cheekL: 205,
  cheekR: 425,
  nose: 1,
  chin: 152,
  forehead: 10,
};

type Mapper = (lm: NormalizedLandmark) => Point;

const avg = (pts: Point[]): Point => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const boundsOf = (pts: Point[]): Rect => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

function toFace(landmarks: NormalizedLandmark[], map: Mapper, id: number): DetectedFace {
  const P = (i: number) => map(landmarks[i]);
  const all = landmarks.map(map);
  const box = boundsOf(all);
  const eyeL = avg(IDX.eyeLRing.map(P));
  const eyeR = avg(IDX.eyeRRing.map(P));
  const roll = (Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) * 180) / Math.PI;
  const eyeWidth = (dist(P(IDX.eyeLOuter), P(IDX.eyeLInner)) + dist(P(IDX.eyeRInner), P(IDX.eyeROuter))) / 2;
  return {
    id,
    box,
    roll,
    features: {
      eyeL,
      eyeR,
      browL: boundsOf(IDX.browL.map(P)),
      browR: boundsOf(IDX.browR.map(P)),
      mouth: avg([P(IDX.lipTop), P(IDX.lipBottom), P(IDX.mouthLeft), P(IDX.mouthRight)]),
      mouthWidth: dist(P(IDX.mouthLeft), P(IDX.mouthRight)),
      cheekL: P(IDX.cheekL),
      cheekR: P(IDX.cheekR),
      nose: P(IDX.nose),
      chin: P(IDX.chin),
      forehead: P(IDX.forehead),
      eyeWidth,
    },
  };
}

function iou(a: Rect, b: Rect) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a.w * a.h + b.w * b.h - inter || 1);
}

/** Detects faces on an offscreen canvas holding a region of the image. */
function detectRegion(lm: FaceLandmarkerType, img: HTMLImageElement, region: Rect, maxSide = 1280) {
  const scale = Math.min(1, maxSide / Math.max(region.w, region.h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(region.w * scale);
  canvas.height = Math.round(region.h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, canvas.width, canvas.height);
  const result = lm.detect(canvas);
  const map: Mapper = (p) => ({ x: region.x + p.x * region.w, y: region.y + p.y * region.h });
  return result.faceLandmarks.map((l) => toFace(l, map, 0));
}

/**
 * Runs face detection on the full image. If nothing is found (e.g. small faces in a
 * large group shot), retries on overlapping tiles and merges the results.
 */
export async function detectFaces(img: HTMLImageElement): Promise<DetectedFace[]> {
  const lm = await loadFaceLandmarker();
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  return quietly(() => {
    let faces = detectRegion(lm, img, { x: 0, y: 0, w: W, h: H });

    if (faces.length === 0 && Math.max(W, H) > 700) {
      const tw = W * 0.6;
      const th = H * 0.6;
      const found: DetectedFace[] = [];
      for (const fx of [0, W - tw]) {
        for (const fy of [0, H - th]) {
          for (const f of detectRegion(lm, img, { x: fx, y: fy, w: tw, h: th })) {
            if (!found.some((g) => iou(g.box, f.box) > 0.3)) found.push(f);
          }
        }
      }
      faces = found;
    }

    const minSize = Math.max(16, Math.min(W, H) * 0.03);
    return faces
      .filter((f) => f.box.w >= minSize && f.box.h >= minSize)
      .sort((a, b) => a.box.x - b.box.x)
      .map((f, i) => ({ ...f, id: i }));
  });
}
