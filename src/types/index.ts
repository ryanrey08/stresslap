export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Key facial features, in original-image pixel coordinates. "L"/"R" = image left/right. */
export interface FaceFeatures {
  eyeL: Point;
  eyeR: Point;
  browL: Rect;
  browR: Rect;
  mouth: Point;
  cheekL: Point;
  cheekR: Point;
  nose: Point;
  chin: Point;
  forehead: Point;
  eyeWidth: number;
  mouthWidth: number;
}

export interface DetectedFace {
  id: number;
  box: Rect;
  features: FaceFeatures;
  /** Head roll in degrees (eye line tilt). */
  roll: number;
}

export interface LoadedImage {
  url: string;
  name: string;
  width: number;
  height: number;
}

export type ActionType = "slap" | "punch" | "kick";
export type Side = "left" | "right";

export interface InteractionStats {
  slap: number;
  punch: number;
  kick: number;
}

export type DetectionStatus = "empty" | "loading-image" | "detecting" | "ready" | "no-face" | "error";
