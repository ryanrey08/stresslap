"use client";

import { useMemo, type CSSProperties, type MouseEvent } from "react";
import { Loader2, ScanFace } from "lucide-react";
import { ImagePatch } from "./ImagePatch";
import { FaceReactionLayer, ImpactEffects, type WrapRegions } from "./ReactionEffects";
import { SlapAnimation } from "./animations/SlapAnimation";
import { PunchAnimation } from "./animations/PunchAnimation";
import { KickAnimation } from "./animations/KickAnimation";
import { ACTIONS } from "@/lib/actions";
import { computeGeometry, featureRegions, lerp, PAD_RATIO } from "@/lib/geometry";
import type { ActiveAction, Phase } from "@/hooks/useActionSequencer";
import type { DetectedFace, DetectionStatus, LoadedImage, Point, Side } from "@/types";

interface FacePreviewProps {
  /** The photo to show. Its url may point at the composite (original + permanent effects). */
  image: LoadedImage | null;
  face: DetectedFace | null;
  status: DetectionStatus;
  phase: Phase;
  active: ActiveAction | null;
  /** User tapped the face: punch at that spot (stage %). */
  onTap?: (at: Point, side: Side) => void;
}

/** Stage-% hit point for an action (where the hand / glove / sneaker connects). */
export function hitPoint(type: ActiveAction["type"], side: Side, toStage: (p: Point) => Point, face: DetectedFace): Point {
  const f = face.features;
  const cheek = side === "right" ? f.cheekR : f.cheekL;
  if (type === "slap") return toStage(cheek);
  if (type === "punch") return toStage(lerp(f.nose, cheek, 0.6));
  return toStage(lerp(lerp(f.chin, cheek, 0.45), f.mouth, -0.15));
}

export function FacePreview({ image, face, status, phase, active, onTap }: FacePreviewProps) {
  const geo = useMemo(() => (image && face ? computeGeometry(image, face) : null), [image, face]);
  const regions = useMemo(() => {
    if (!face || !geo) return null;
    const img = featureRegions(face) as WrapRegions;
    const wrap = Object.fromEntries(Object.entries(img).map(([k, r]) => [k, geo.rectWrap(r)])) as unknown as WrapRegions;
    return { img, wrap };
  }, [face, geo]);

  const showStage = image && face && geo && regions && status === "ready";

  if (!showStage) {
    return (
      <div className="stage relative grid aspect-square w-full place-items-center overflow-hidden rounded-[2rem]">
        {image && (status === "detecting" || status === "no-face") && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL
          <img src={image.url} alt="Your photo being scanned for a face" className={`absolute inset-0 size-full object-contain ${status === "no-face" ? "opacity-40 grayscale" : "opacity-60"}`} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
          {status === "detecting" || status === "loading-image" ? (
            <>
              <div className="relative">
                <ScanFace className="size-20 text-yellow-300" />
                <Loader2 className="absolute -right-3 -bottom-3 size-8 animate-spin text-pink-300" />
              </div>
              <p className="font-display text-3xl tracking-wide">Scanning for faces...</p>
              {image && <div className="anim-scanline pointer-events-none absolute inset-x-0 top-0 h-1 bg-yellow-300/80 shadow-[0_0_20px_#fde047]" />}
            </>
          ) : status === "no-face" ? (
            <>
              <EmptyFace sad />
              <p className="font-display text-3xl tracking-wide">No face found</p>
              <p className="max-w-xs text-sm text-white/80">Try another photo with a clear, front-facing face.</p>
            </>
          ) : (
            <>
              <EmptyFace />
              <p className="font-display text-3xl tracking-wide">Your target appears here</p>
              <p className="max-w-xs text-sm text-white/80">Upload a photo with a face to start the fun.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const { toStage, toWrap, lenStage, render } = geo;
  const padPct = PAD_RATIO * 100;
  const faceW = lenStage(face.box.w);
  const faceWWrap = (face.box.w / render.w) * 100;
  const f = face.features;

  const running = active && phase !== "idle";
  const showAttack = active && (phase === "windup" || phase === "impact");
  const showImpact = active && phase === "impact";
  const cfg = active ? ACTIONS[active.type] : null;
  const after = cfg ? cfg.duration - cfg.impactAt : 0;
  const target = active && cfg ? active.target ?? hitPoint(active.type, active.side, toStage, face) : null;
  const m = active?.side === "left" ? -1 : 1;
  const chin = toWrap(f.chin);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onTap) return;
    const r = e.currentTarget.getBoundingClientRect();
    const at = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    const center = toStage({ x: face.box.x + face.box.w / 2, y: face.box.y + face.box.h / 2 });
    onTap(at, at.x >= center.x ? "right" : "left");
  };

  const fb = { tl: toStage({ x: face.box.x, y: face.box.y }), w: faceW, h: lenStage(face.box.h) };

  return (
    <div
      className="stage relative aspect-square w-full cursor-crosshair touch-manipulation overflow-hidden rounded-[2rem] select-none"
      style={{ "--m": m } as CSSProperties}
      onClick={onClick}
      role="img"
      aria-label={running ? `${active?.type} in progress` : "Detected face. Tap the face to punch that spot."}
    >
      {/* soft blurred backdrop fills any area outside the photo */}
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
      <img src={image.url} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl" />
      <div key={showImpact ? `shake-${active.id}` : "still"} className={`absolute inset-0 ${showImpact ? `anim-shake-${active.type}` : ""}`} style={{ animationDuration: `${after}ms` }}>
        {/* the head: oversized so movement never shows empty edges */}
        <div
          key={showImpact ? `head-${active.id}` : "head"}
          className={`absolute aspect-square ${showImpact ? `anim-head-${active.type}` : "anim-idle-bob"}`}
          style={{
            left: `-${padPct}%`,
            top: `-${padPct}%`,
            width: `${100 + padPct * 2}%`,
            transformOrigin: `${chin.x}% ${chin.y}%`,
            animationDuration: showImpact ? `${after}ms` : undefined,
          }}
        >
          {/* layers 1 + 2: original photo with every permanent effect baked in */}
          <ImagePatch image={image} region={render} className="absolute inset-0" />
          {/* layer 4: temporary facial reactions */}
          {showImpact && (
            <FaceReactionLayer
              key={active.id}
              image={image}
              action={active}
              imgRegions={regions.img}
              wrapRegions={regions.wrap}
              eyeL={toWrap(f.eyeL)}
              eyeR={toWrap(f.eyeR)}
              mouth={toWrap(f.mouth)}
              forehead={toWrap(f.forehead)}
              faceWidth={faceWWrap}
              durationMs={after}
            />
          )}
        </div>
      </div>

      {/* detection indicator */}
      {!running && (
        <div
          className="anim-lock pointer-events-none absolute z-20"
          style={{ left: `${fb.tl.x - 3}%`, top: `${fb.tl.y - 3}%`, width: `${fb.w + 6}%`, height: `${fb.h + 6}%` }}
          aria-hidden
        >
          {["top-0 left-0 border-t-4 border-l-4 rounded-tl-xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl", "bottom-0 right-0 border-r-4 border-b-4 rounded-br-xl"].map((c) => (
            <span key={c} className={`absolute size-[22%] border-yellow-300 drop-shadow-[0_0_6px_rgba(0,0,0,0.6)] ${c}`} />
          ))}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-yellow-300 px-3 py-0.5 text-[11px] font-black tracking-widest whitespace-nowrap text-purple-900 shadow">
            TARGET LOCKED
          </span>
        </div>
      )}

      {/* layer 3: temporary attacker + impact animations */}
      {showAttack && target && cfg && (
        <div key={`atk-${active.id}`}>
          {active.type === "slap" && <SlapAnimation target={target} faceWidth={faceW} side={active.side} durationMs={cfg.duration} />}
          {active.type === "punch" && <PunchAnimation target={target} faceWidth={faceW} side={active.side} durationMs={cfg.duration} />}
          {active.type === "kick" && <KickAnimation target={target} faceWidth={faceW} side={active.side} durationMs={cfg.duration} />}
        </div>
      )}

      {showImpact && target && <ImpactEffects key={`fx-${active.id}`} action={active} at={target} faceWidth={faceW} durationMs={after} />}
    </div>
  );
}

function EmptyFace({ sad }: { sad?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="anim-float size-32 drop-shadow-xl" aria-hidden>
      <circle cx="60" cy="60" r="54" fill="#fde047" stroke="#3b1d0e" strokeWidth="5" />
      <circle cx="42" cy="50" r="7" fill="#3b1d0e" />
      <circle cx="78" cy="50" r="7" fill="#3b1d0e" />
      <ellipse cx="30" cy="70" rx="9" ry="6" fill="#fb7185" opacity="0.6" />
      <ellipse cx="90" cy="70" rx="9" ry="6" fill="#fb7185" opacity="0.6" />
      {sad ? (
        <path d="M40 88 Q60 72 80 88" stroke="#3b1d0e" strokeWidth="5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M38 76 Q60 98 82 76" stroke="#3b1d0e" strokeWidth="5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
