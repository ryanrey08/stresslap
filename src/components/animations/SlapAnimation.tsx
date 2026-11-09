import { Attacker } from "./Attacker";
import type { Point, Side } from "@/types";

const OUTLINE = "#3b1d0e";

/** Open cartoon hand, palm forward, fingers pointing left. */
export function CartoonHand() {
  return (
    <svg viewBox="0 0 220 130" className="size-full drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]">
      <g stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round">
        <rect x="140" y="30" width="100" height="70" rx="10" fill="#8b5cf6" />
        <rect x="132" y="26" width="22" height="78" rx="8" fill="#c4b5fd" />
        <rect x="70" y="2" width="22" height="50" rx="11" fill="#ffd2a6" transform="rotate(-35 81 27)" />
        <rect x="58" y="22" width="84" height="88" rx="34" fill="#ffd2a6" />
        <rect x="8" y="28" width="80" height="19" rx="9.5" fill="#ffd2a6" />
        <rect x="2" y="49" width="86" height="19" rx="9.5" fill="#ffd2a6" />
        <rect x="8" y="70" width="80" height="19" rx="9.5" fill="#ffd2a6" />
        <rect x="22" y="91" width="66" height="17" rx="8.5" fill="#ffd2a6" />
      </g>
      <ellipse cx="102" cy="66" rx="22" ry="26" fill="#ffb98a" opacity="0.6" />
    </svg>
  );
}

interface Props {
  target: Point;
  faceWidth: number;
  side: Side;
  durationMs: number;
}

export function SlapAnimation({ target, faceWidth, side, durationMs }: Props) {
  return (
    <Attacker target={target} width={faceWidth * 1.05} side={side} aspect={130 / 220} overlap={0.12} animationClass="anim-slap-hand" durationMs={durationMs}>
      <CartoonHand />
    </Attacker>
  );
}
