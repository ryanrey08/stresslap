import type { ReactNode } from "react";
import type { Point, Side } from "@/types";

interface AttackerProps {
  /** Contact point, % of stage. */
  target: Point;
  /** Width, % of stage. */
  width: number;
  /** Which side of the stage the attacker comes from. */
  side: Side;
  /** Fraction of the glyph's width (from its leading edge) that overlaps the target. */
  overlap?: number;
  /** Glyph aspect ratio (height / width). */
  aspect: number;
  animationClass: string;
  durationMs: number;
  children: ReactNode;
}

/**
 * Positions a cartoon hand / glove / sneaker so its leading (left) edge lands on the target.
 * Glyphs are drawn pointing left (coming from the right); for side="left" the whole thing is
 * mirrored around the contact point.
 */
export function Attacker({ target, width, side, overlap = 0.1, aspect, animationClass, durationMs, children }: AttackerProps) {
  const lead = overlap * 100;
  const transform = side === "right" ? `translate(-${lead}%, -50%)` : `translate(-${100 - lead}%, -50%) scaleX(-1)`;
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: `${target.x}%`, top: `${target.y}%`, width: `${width}%`, aspectRatio: `${1 / aspect}`, transform }}
      aria-hidden
    >
      <div className={`size-full ${animationClass}`} style={{ animationDuration: `${durationMs}ms` }}>
        {children}
      </div>
    </div>
  );
}
