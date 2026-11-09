import { Attacker } from "./Attacker";
import type { Point, Side } from "@/types";

const OUTLINE = "#3b1d0e";

/** Big, squishy cartoon boxing glove pointing left. */
export function CartoonGlove() {
  return (
    <svg viewBox="0 0 230 150" className="size-full drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]">
      <g stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round">
        <rect x="150" y="42" width="100" height="66" rx="10" fill="#38bdf8" />
        <rect x="128" y="34" width="40" height="82" rx="12" fill="#f8fafc" />
        <path d="M134 30 C 120 6, 40 0, 18 40 C -2 76, 10 128, 60 140 C 100 150, 132 132, 138 110 Z" fill="#ef4444" />
        <path d="M120 40 C 110 18, 70 18, 66 40 C 64 58, 104 66, 120 56 Z" fill="#f87171" />
      </g>
      <path d="M40 46 C 50 30, 70 26, 84 28" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.6" />
      <rect x="136" y="60" width="24" height="10" rx="4" fill="#ef4444" />
      <rect x="136" y="80" width="24" height="10" rx="4" fill="#ef4444" />
    </svg>
  );
}

interface Props {
  target: Point;
  faceWidth: number;
  side: Side;
  durationMs: number;
}

export function PunchAnimation({ target, faceWidth, side, durationMs }: Props) {
  return (
    <Attacker target={target} width={faceWidth * 1.0} side={side} aspect={150 / 230} overlap={0.16} animationClass="anim-punch-glove" durationMs={durationMs}>
      <CartoonGlove />
    </Attacker>
  );
}
