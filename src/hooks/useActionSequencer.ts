"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIONS, COOLDOWN_MS } from "@/lib/actions";
import type { ActionType, Point, Side } from "@/types";

export type Phase = "idle" | "windup" | "impact" | "cooldown";

export interface ActiveAction {
  id: number;
  type: ActionType;
  side: Side;
  burstWord: string;
  /** Optional custom hit point (% of stage), e.g. where the user tapped. */
  target?: Point;
}

interface Handlers {
  onStart?: (a: ActiveAction) => void;
  onImpact?: (a: ActiveAction) => void;
  onComplete?: (a: ActiveAction) => void;
}

/**
 * Drives one action at a time through windup -> impact -> cooldown -> idle.
 * Triggers while an action is running are ignored (no overlapping animations).
 */
export function useActionSequencer(handlers: Handlers) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [active, setActive] = useState<ActiveAction | null>(null);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const nextId = useRef(1);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const cancel = useCallback(() => {
    clear();
    busy.current = false;
    setPhase("idle");
    setActive(null);
  }, [clear]);

  const trigger = useCallback(
    (type: ActionType, side: Side, burstWord: string, target?: Point) => {
      if (busy.current) return false;
      busy.current = true;
      const cfg = ACTIONS[type];
      const action: ActiveAction = { id: nextId.current++, type, side, burstWord, target };
      setActive(action);
      setPhase("windup");
      handlersRef.current.onStart?.(action);
      const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
      at(cfg.impactAt, () => {
        setPhase("impact");
        handlersRef.current.onImpact?.(action);
      });
      at(cfg.duration, () => {
        setPhase("cooldown");
        handlersRef.current.onComplete?.(action);
      });
      at(cfg.duration + COOLDOWN_MS, () => {
        busy.current = false;
        timers.current = [];
        setPhase("idle");
        setActive(null);
      });
      return true;
    },
    [],
  );

  useEffect(() => clear, [clear]);

  return { phase, active, trigger, cancel, isBusy: phase !== "idle" };
}
