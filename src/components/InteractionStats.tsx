import { Footprints, Hand, Sparkles, Zap } from "lucide-react";
import type { InteractionStats as Stats } from "@/types";

export function InteractionStats({ stats }: { stats: Stats }) {
  const total = stats.slap + stats.punch + stats.kick;
  const relief = Math.min(100, Math.round(stats.slap * 3 + stats.punch * 4 + stats.kick * 6));
  const items = [
    { label: "Slaps", value: stats.slap, Icon: Hand, color: "text-pink-300" },
    { label: "Punches", value: stats.punch, Icon: Zap, color: "text-orange-300" },
    { label: "Kicks", value: stats.kick, Icon: Footprints, color: "text-lime-300" },
    { label: "Total", value: total, Icon: Sparkles, color: "text-yellow-300" },
  ];
  return (
    <section className="card flex flex-col gap-4 self-start p-5" aria-label="Interaction statistics">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ label, value, Icon, color }) => (
          <div key={label} className="flex flex-col items-center rounded-2xl bg-white/10 p-3">
            <Icon className={`size-5 ${color}`} />
            <span key={value} className={`font-display anim-pop text-4xl ${color}`} data-testid={`stat-${label.toLowerCase()}`}>
              {value}
            </span>
            <span className="text-xs font-bold tracking-wider text-white/70 uppercase">{label}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs font-bold text-white/80">
          <span>Stress relieved</span>
          <span>{relief}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-black/30" role="progressbar" aria-valuenow={relief} aria-valuemin={0} aria-valuemax={100} aria-label="Stress relieved">
          <div className="h-full rounded-full bg-gradient-to-r from-lime-300 via-yellow-300 to-pink-400 transition-[width] duration-500" style={{ width: `${relief}%` }} />
        </div>
      </div>
    </section>
  );
}
