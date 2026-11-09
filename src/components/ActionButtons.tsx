"use client";

import { Dices, Footprints, Hand, Zap } from "lucide-react";
import type { ActionType } from "@/types";

interface ActionButtonsProps {
  onAction: (type: ActionType) => void;
  onRandom: () => void;
  disabled: boolean;
  busy: boolean;
  activeType?: ActionType | null;
}

const BUTTONS: { type: ActionType; label: string; hint: string; key: string; Icon: typeof Hand; className: string }[] = [
  { type: "slap", label: "SLAP", hint: "A cheeky open hand", key: "S", Icon: Hand, className: "from-pink-500 to-rose-500 shadow-[0_8px_0_#9f1239]" },
  { type: "punch", label: "PUNCH", hint: "Soft cartoon glove", key: "P", Icon: Zap, className: "from-orange-400 to-red-500 shadow-[0_8px_0_#9a3412]" },
  { type: "kick", label: "KICK", hint: "Flying sneaker", key: "K", Icon: Footprints, className: "from-lime-400 to-emerald-500 shadow-[0_8px_0_#166534]" },
];

export function ActionButtons({ onAction, onRandom, disabled, busy, activeType }: ActionButtonsProps) {
  return (
    <section className="card flex flex-col gap-4 p-5" aria-label="Actions">
      <h2 className="font-display text-2xl tracking-wide text-yellow-300">2. Choose your move</h2>
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {BUTTONS.map(({ type, label, hint, key, Icon, className }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAction(type)}
            disabled={disabled}
            aria-keyshortcuts={key}
            className={`action-btn group bg-gradient-to-br ${className} ${activeType === type ? "translate-y-1 brightness-110" : ""}`}
          >
            <Icon className="size-8 transition group-hover:scale-125 group-hover:-rotate-12 lg:size-10" strokeWidth={2.5} />
            <span className="font-display text-2xl tracking-wider lg:text-4xl">{label}</span>
            <span className="hidden text-xs font-semibold text-white/85 lg:block">{hint}</span>
            <kbd className="absolute top-2 right-2 hidden rounded-md bg-black/25 px-1.5 text-[10px] font-bold lg:block">{key}</kbd>
          </button>
        ))}
      </div>
      <button type="button" onClick={onRandom} disabled={disabled} aria-keyshortcuts="Space" className="btn-random">
        <Dices className={`size-5 ${busy ? "animate-spin" : ""}`} />
        Random action
      </button>
      <p className="text-center text-xs text-white/60">
        {disabled && !busy ? "Upload a photo with a face to unlock the moves." : "Tip: tap the face to punch that exact spot!"}
      </p>
    </section>
  );
}
