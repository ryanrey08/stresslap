import type { CSSProperties } from "react";
import { ImagePatch } from "./ImagePatch";
import type { ActiveAction } from "@/hooks/useActionSequencer";
import type { LoadedImage, Point, Rect } from "@/types";

/* ---------- small helpers ---------- */

/** Deterministic pseudo-random numbers so effects are pure functions of the action id. */
function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const pos = (p: Point, extra?: CSSProperties): CSSProperties => ({ left: `${p.x}%`, top: `${p.y}%`, ...extra });
const box = (r: Rect, extra?: CSSProperties): CSSProperties => ({
  left: `${r.x}%`,
  top: `${r.y}%`,
  width: `${r.w}%`,
  height: `${r.h}%`,
  ...extra,
});

function Star({ fill = "#fde047", className = "", style }: { fill?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path
        d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z"
        fill={fill}
        stroke="#3b1d0e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- impact effects (stage coordinates, stay where the hit landed) ---------- */

interface ImpactEffectsProps {
  action: ActiveAction;
  /** Contact point, % of stage. */
  at: Point;
  /** Face width, % of stage. */
  faceWidth: number;
  durationMs: number;
}

export function ImpactEffects({ action, at, faceWidth, durationMs }: ImpactEffectsProps) {
  const rand = seeded(action.id);
  const { type, side } = action;
  const away = side === "right" ? -1 : 1; // direction the hit pushes (towards the far side)
  const burstSize = faceWidth * (type === "kick" ? 0.95 : type === "punch" ? 0.8 : 0.7);
  const burstColors = { slap: ["#fde047", "#fb7185"], punch: ["#fde047", "#f97316"], kick: ["#a3e635", "#22d3ee"] }[type];
  const particleCount = type === "kick" ? 12 : type === "punch" ? 10 : 7;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2 + rand() * 0.6;
    const dist = 260 + rand() * 320;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      size: faceWidth * (0.08 + rand() * 0.08),
      spin: (rand() > 0.5 ? 1 : -1) * (180 + rand() * 360),
      color: ["#fde047", "#fb923c", "#f472b6", "#ffffff"][Math.floor(rand() * 4)],
      delay: rand() * 60,
    };
  });
  const ms = (n: number) => `${n}ms`;
  const life = Math.min(900, durationMs);

  return (
    <div className="pointer-events-none absolute inset-0 z-40" aria-hidden>
      {/* white flash */}
      <div className="anim-flash absolute inset-0 bg-white" style={{ animationDuration: ms(240) }} />

      {/* shockwave rings */}
      {type !== "slap" &&
        [0, 1].map((i) => (
          <div
            key={i}
            className="anim-shockwave absolute rounded-full border-[6px] border-white/90"
            style={pos(at, {
              width: `${faceWidth * 0.5}%`,
              aspectRatio: "1",
              animationDuration: ms(600),
              animationDelay: ms(i * 110),
            })}
          />
        ))}

      {/* motion / speed lines */}
      {type !== "punch" && (
        <div className="absolute" style={pos(at, { width: `${faceWidth * 0.9}%`, aspectRatio: "1", transform: `translate(-50%,-50%) scaleX(${-away})` })}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="anim-speedline absolute h-[5%] rounded-full bg-white"
              style={{ left: "55%", top: `${18 + i * 16}%`, width: `${40 + (i % 2) * 20}%`, animationDuration: ms(420), animationDelay: ms(i * 25) }}
            />
          ))}
        </div>
      )}

      {/* comic burst with word */}
      <div className="absolute" style={pos(at, { width: `${burstSize}%`, aspectRatio: "1", transform: "translate(-50%,-60%)" })}>
        <div className="anim-burst size-full" style={{ animationDuration: ms(life) }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            <polygon
              points={Array.from({ length: 24 }, (_, i) => {
                const r = i % 2 === 0 ? 50 : 32 + (i % 4) * 3;
                const a = (i / 24) * Math.PI * 2;
                return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
              }).join(" ")}
              fill={burstColors[0]}
              stroke="#3b1d0e"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="50" r="24" fill={burstColors[1]} opacity="0.85" />
          </svg>
          <span
            className="font-display absolute inset-0 grid place-items-center text-center leading-none text-white"
            style={{ fontSize: "clamp(14px, 3.4vw, 40px)", WebkitTextStroke: "2px #3b1d0e", transform: `rotate(${away * 8}deg)` }}
          >
            {action.burstWord}
          </span>
        </div>
      </div>

      {/* flying stars */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={pos(at, { width: `${p.size}%`, aspectRatio: "1", transform: "translate(-50%,-50%)" })}
        >
          <Star
            fill={p.color}
            className="anim-particle size-full"
            style={
              {
                "--dx": `${p.dx}%`,
                "--dy": `${p.dy}%`,
                "--spin": `${p.spin}deg`,
                animationDuration: ms(life),
                animationDelay: ms(p.delay),
              } as CSSProperties
            }
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- face reactions (wrapper coordinates, move with the head) ---------- */

export interface WrapRegions {
  eyeL: Rect;
  eyeR: Rect;
  browL: Rect;
  browR: Rect;
  mouth: Rect;
  cheekL: Rect;
  cheekR: Rect;
}

interface FaceReactionLayerProps {
  image: LoadedImage;
  action: ActiveAction;
  /** Regions in image px (for which part of the photo to copy). */
  imgRegions: WrapRegions;
  /** Same regions in % of wrapper (where to put them). */
  wrapRegions: WrapRegions;
  /** Feature points in % of wrapper. */
  eyeL: Point;
  eyeR: Point;
  mouth: Point;
  forehead: Point;
  /** Face width in % of wrapper. */
  faceWidth: number;
  durationMs: number;
}

/**
 * Fakes expressions by copying small regions of the photo (eyes, brows, mouth, cheeks)
 * and warping them with CSS transforms, plus cartoon overlays.
 */
export function FaceReactionLayer({ image, action, imgRegions, wrapRegions, eyeL, eyeR, mouth, forehead, faceWidth, durationMs }: FaceReactionLayerProps) {
  const { type, side } = action;
  const hitCheek = side === "right" ? "cheekR" : "cheekL";
  const d = `${durationMs}ms`;
  const intensity = type === "slap" ? "md" : "lg";
  const patch = (key: keyof WrapRegions, cls: string, origin = "50% 50%") => (
    <ImagePatch
      key={key}
      image={image}
      region={imgRegions[key]}
      feather
      className={`absolute ${cls}`}
      style={box(wrapRegions[key], { transformOrigin: origin, animationDuration: d })}
    />
  );
  const eyeSize = wrapRegions.eyeL.w;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* cheek squish on the side that was hit */}
      {patch(hitCheek, side === "right" ? "anim-cheek-squish-r" : "anim-cheek-squish-l")}

      {/* eyebrows shoot up (stretched from the eye line upwards) */}
      {patch("browL", `anim-brow-raise-${intensity}`, "50% 100%")}
      {patch("browR", `anim-brow-raise-${intensity}`, "50% 100%")}

      {/* eyes widen */}
      {patch("eyeL", `anim-eye-widen-${intensity}`)}
      {patch("eyeR", `anim-eye-widen-${intensity}`)}

      {/* jaw drops */}
      {patch("mouth", `anim-mouth-open-${intensity}`, "50% 20%")}

      {/* cartoon open mouth for the bigger hits */}
      {type !== "slap" && (
        <div
          className="anim-mouth-o absolute"
          style={pos(mouth, { width: `${wrapRegions.mouth.w * 0.42}%`, aspectRatio: "0.9", animationDuration: d })}
        >
          <svg viewBox="0 0 90 100" className="size-full" style={{ mixBlendMode: "multiply" }}>
            <ellipse cx="45" cy="50" rx="42" ry="47" fill="#5b0f1a" />
            <ellipse cx="45" cy="78" rx="26" ry="16" fill="#e45a78" />
          </svg>
        </div>
      )}

      {/* sweat drop for slaps */}
      {type === "slap" && (
        <div
          className="anim-sweat absolute"
          style={pos(
            { x: (side === "right" ? eyeL.x : eyeR.x) + (side === "right" ? -1 : 1) * eyeSize * 0.6, y: forehead.y + (eyeL.y - forehead.y) * 0.4 },
            { width: `${faceWidth * 0.12}%`, aspectRatio: "0.7", animationDuration: d },
          )}
        >
          <svg viewBox="0 0 28 40" className="size-full">
            <path d="M14 2 C 22 16, 26 22, 26 28 A 12 12 0 0 1 2 28 C 2 22, 6 16, 14 2 Z" fill="#7dd3fc" stroke="#0c4a6e" strokeWidth="2" />
            <ellipse cx="10" cy="27" rx="3" ry="5" fill="#fff" opacity="0.8" />
          </svg>
        </div>
      )}

      {/* dizzy spiral eyes for kicks */}
      {type === "kick" &&
        [eyeL, eyeR].map((e, i) => (
          <div key={i} className="anim-dizzy-eye absolute" style={pos(e, { width: `${eyeSize * 0.75}%`, aspectRatio: "1", animationDuration: d })}>
            <svg viewBox="0 0 40 40" className="anim-spin size-full">
              <circle cx="20" cy="20" r="18" fill="#fff" stroke="#3b1d0e" strokeWidth="2.5" />
              <path
                d="M20 20 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 1 1 4 4 a6 6 0 1 1 -6 -6 a8 8 0 1 1 8 8 a10 10 0 1 1 -10 -10 a12 12 0 1 1 12 12"
                fill="none"
                stroke="#3b1d0e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}

      {/* orbiting stars after punches & kicks */}
      {type !== "slap" && (
        <div
          className="anim-orbit-wrap absolute"
          style={{
            left: `${forehead.x - faceWidth * 0.45}%`,
            top: `${forehead.y - faceWidth * 0.14}%`,
            width: `${faceWidth * 0.9}%`,
            height: `${faceWidth * 0.2}%`,
            animationDuration: d,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="anim-orbit-x absolute inset-y-0 w-0" style={{ animationDelay: `${-i * 0.27}s` }}>
              <div className="anim-orbit-y absolute w-0" style={{ animationDelay: `${-i * 0.27 - 0.275}s` }}>
                <Star className="absolute size-[clamp(14px,3.2vw,30px)] -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
