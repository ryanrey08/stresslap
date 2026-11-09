import { Attacker } from "./Attacker";
import type { Point, Side } from "@/types";

const OUTLINE = "#3b1d0e";

/** Cartoon sneaker on a jeans leg, toe pointing left. */
export function CartoonSneaker() {
  return (
    <svg viewBox="0 0 260 150" className="size-full drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]">
      <g stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round">
        <path d="M150 20 L 280 10 L 280 92 L 160 100 Z" fill="#2563eb" />
        <rect x="140" y="20" width="30" height="82" rx="8" fill="#f8fafc" />
        <path d="M150 28 C 120 30, 100 44, 74 54 C 40 64, 10 70, 8 98 C 6 116, 24 122, 50 122 L 160 120 Z" fill="#f97316" />
        <path d="M4 104 C 6 128, 26 136, 52 136 L 164 134 L 164 116 L 52 120 C 26 120, 8 116, 4 104 Z" fill="#fef3c7" />
        <path d="M60 64 C 80 56, 104 52, 124 54" fill="none" />
      </g>
      <g stroke="#fff" strokeWidth="5" strokeLinecap="round">
        <line x1="96" y1="50" x2="110" y2="66" />
        <line x1="112" y1="44" x2="126" y2="60" />
        <line x1="128" y1="40" x2="140" y2="56" />
      </g>
      <path d="M48 96 C 80 86, 110 84, 150 90" stroke="#fde68a" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface Props {
  target: Point;
  faceWidth: number;
  side: Side;
  durationMs: number;
}

export function KickAnimation({ target, faceWidth, side, durationMs }: Props) {
  return (
    <Attacker target={target} width={faceWidth * 1.35} side={side} aspect={150 / 260} overlap={0.1} animationClass="anim-kick-foot" durationMs={durationMs}>
      <CartoonSneaker />
    </Attacker>
  );
}
