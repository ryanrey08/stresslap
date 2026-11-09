import type { ActionType, Side } from "@/types";

export interface ActionConfig {
  type: ActionType;
  label: string;
  /** ms from trigger until the hit lands */
  impactAt: number;
  /** ms for the whole sequence */
  duration: number;
  burstWords: string[];
  messages: string[];
}

/** Short pause after an action finishes before another one may start. */
export const COOLDOWN_MS = 220;

export const ACTIONS: Record<ActionType, ActionConfig> = {
  slap: {
    type: "slap",
    label: "Slap",
    impactAt: 380,
    duration: 1300,
    burstWords: ["SLAP!", "THWAP!", "SMACK!", "WHAP!"],
    messages: [
      "That was a powerful slap!",
      "Five fingers of pure relief!",
      "Cheek status: rosy.",
      "That slap echoed across three time zones!",
      "Ooh, right on the cheek!",
      "A slap so crisp it deserves an award.",
    ],
  },
  punch: {
    type: "punch",
    label: "Punch",
    impactAt: 420,
    duration: 1450,
    burstWords: ["POW!", "BAM!", "BOP!", "KAPOW!"],
    messages: [
      "Whoa! Didn't see that coming!",
      "A pillow-soft glove of justice!",
      "Seeing stars yet?",
      "Knock-knock! Who's there? A glove!",
      "That one rattled the eyebrows!",
      "Float like a butterfly, bop like a glove!",
    ],
  },
  kick: {
    type: "kick",
    label: "Kick",
    impactAt: 520,
    duration: 1850,
    burstWords: ["BOOM!", "WHAM!", "KA-BOOM!", "BONK!"],
    messages: [
      "That kick was unexpected!",
      "Sent into low orbit!",
      "Somebody call a cartoon doctor!",
      "That sneaker had a mind of its own!",
      "A kick worthy of the highlight reel!",
      "Dizzy, dizzy, dizzy...",
    ],
  },
};

export const ACTION_TYPES: ActionType[] = ["slap", "punch", "kick"];

export const MILESTONE_MESSAGES: Record<number, string> = {
  10: "The face needs a moment to recover!",
  25: "25 hits! Your stress is filing a complaint.",
  50: "50! You're officially a stress-relief champion.",
  100: "100 hits! Legendary. Maybe drink some water?",
};

export const IDLE_MESSAGES = [
  "Ready when you are. Pick an action!",
  "The face awaits its fate...",
];

export function pick<T>(arr: T[], avoid?: T): T {
  if (arr.length < 2) return arr[0];
  let v = arr[Math.floor(Math.random() * arr.length)];
  while (v === avoid) v = arr[Math.floor(Math.random() * arr.length)];
  return v;
}

export function randomSide(): Side {
  return Math.random() < 0.5 ? "left" : "right";
}
