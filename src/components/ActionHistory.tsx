"use client";

import { useEffect, useRef } from "react";
import { Footprints, Hand, History, Zap } from "lucide-react";
import type { PersistentEffect } from "@/lib/effects";
import type { ActionType } from "@/types";

const META: Record<ActionType, { label: string; Icon: typeof Hand; color: string }> = {
  slap: { label: "Slap", Icon: Hand, color: "text-pink-300" },
  punch: { label: "Punch", Icon: Zap, color: "text-orange-300" },
  kick: { label: "Kick", Icon: Footprints, color: "text-lime-300" },
};

/** One row per permanent effect, so the history can never drift from what's drawn on the photo. */
export function ActionHistory({ effects }: { effects: PersistentEffect[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [effects.length]);

  return (
    <section className="card flex flex-col gap-3 p-5" aria-label="Action history">
      <h2 className="font-display flex items-center gap-2 text-2xl tracking-wide text-yellow-300">
        <History className="size-5" /> Action history
      </h2>
      <div ref={scroller} className="max-h-[360px] min-h-24 overflow-y-auto rounded-2xl bg-black/20">
        {effects.length === 0 ? (
          <p className="p-6 text-center text-sm text-white/60">No hits yet. Your moves will be listed here.</p>
        ) : (
          <table className="w-full text-sm" data-testid="history-table">
            <thead className="sticky top-0 bg-purple-950/90 text-left text-xs tracking-wider text-white/60 uppercase">
              <tr>
                <th className="px-4 py-2 font-bold">#</th>
                <th className="px-4 py-2 font-bold">Action</th>
                <th className="px-4 py-2 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {effects.map((e, i) => {
                const { label, Icon, color } = META[e.type];
                return (
                  <tr key={e.id} className={`border-t border-white/10 ${i === effects.length - 1 ? "anim-pop bg-white/5" : ""}`}>
                    <td className="px-4 py-2 font-bold text-white/70">{i + 1}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-2 font-bold ${color}`}>
                        <Icon className="size-4" /> {label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="rounded-full bg-lime-300/20 px-2 py-0.5 text-xs font-bold text-lime-200">Applied</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
