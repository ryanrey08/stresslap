"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { playSound, unlockAudio, type SoundName } from "@/lib/sound";

interface SoundContextValue {
  enabled: boolean;
  toggle: () => void;
  /** Call synchronously inside a click/key handler so browsers allow audio. */
  unlock: () => void;
  play: (name: SoundName, delayMs?: number) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);
const STORAGE_KEY = "stresslap:sound";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "off") setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      if (next) {
        unlockAudio();
        playSound("ready");
      }
      return next;
    });
  }, []);

  const unlock = useCallback(() => {
    if (enabled) unlockAudio();
  }, [enabled]);

  const play = useCallback(
    (name: SoundName, delayMs?: number) => {
      if (enabled) playSound(name, delayMs);
    },
    [enabled],
  );

  const value = useMemo(() => ({ enabled, toggle, unlock, play }), [enabled, toggle, unlock, play]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside <SoundProvider>");
  return ctx;
}

/** SOUND ON/OFF toggle button. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const { enabled, toggle } = useSound();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn sound off" : "Turn sound on"}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:scale-105 active:scale-95 ${
        enabled ? "bg-yellow-300 text-purple-900 shadow-[0_4px_0_#a16207]" : "bg-white/15 text-white/80 shadow-[0_4px_0_rgba(0,0,0,0.25)]"
      } ${className}`}
    >
      {enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      <span>Sound {enabled ? "On" : "Off"}</span>
    </button>
  );
}
