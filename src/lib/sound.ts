"use client";

/**
 * Cartoon sound effects synthesised with the Web Audio API — no audio files needed.
 * The AudioContext is only created/resumed from a user gesture (see `unlockAudio`).
 */

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function getNoise(c: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function envGain(c: AudioContext, t: number, peak: number, attack: number, decay: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(c.destination);
  return g;
}

function noise(c: AudioContext, t: number, opts: { type: BiquadFilterType; freq: number; q?: number; peak: number; attack?: number; decay: number; sweepTo?: number }) {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const f = c.createBiquadFilter();
  f.type = opts.type;
  f.frequency.setValueAtTime(opts.freq, t);
  if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + (opts.attack ?? 0.003) + opts.decay);
  f.Q.value = opts.q ?? 1;
  src.connect(f).connect(envGain(c, t, opts.peak, opts.attack ?? 0.003, opts.decay));
  src.start(t);
  src.stop(t + (opts.attack ?? 0.003) + opts.decay + 0.05);
}

function tone(c: AudioContext, t: number, opts: { type?: OscillatorType; from: number; to?: number; peak: number; attack?: number; decay: number; glide?: number; vibrato?: number }) {
  const o = c.createOscillator();
  o.type = opts.type ?? "sine";
  o.frequency.setValueAtTime(opts.from, t);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.glide ?? opts.decay));
  if (opts.vibrato) {
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = opts.vibrato;
    lg.gain.value = opts.from * 0.12;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + (opts.attack ?? 0.005) + opts.decay + 0.05);
  }
  o.connect(envGain(c, t, opts.peak, opts.attack ?? 0.005, opts.decay));
  o.start(t);
  o.stop(t + (opts.attack ?? 0.005) + opts.decay + 0.05);
}

export type SoundName = "whoosh" | "slap" | "punch" | "kick" | "reaction" | "reset" | "ready" | "error";

const players: Record<SoundName, (c: AudioContext, t: number) => void> = {
  whoosh: (c, t) => noise(c, t, { type: "bandpass", freq: 400, sweepTo: 2200, q: 2, peak: 0.25, attack: 0.12, decay: 0.18 }),
  slap: (c, t) => {
    noise(c, t, { type: "highpass", freq: 1800, peak: 0.9, attack: 0.001, decay: 0.12 });
    noise(c, t, { type: "bandpass", freq: 900, q: 1.5, peak: 0.5, attack: 0.001, decay: 0.07 });
    tone(c, t, { type: "triangle", from: 420, to: 160, peak: 0.25, decay: 0.08 });
  },
  punch: (c, t) => {
    tone(c, t, { from: 160, to: 45, peak: 0.9, attack: 0.002, decay: 0.22 });
    noise(c, t, { type: "lowpass", freq: 1200, sweepTo: 200, peak: 0.6, attack: 0.001, decay: 0.12 });
  },
  kick: (c, t) => {
    tone(c, t, { from: 110, to: 32, peak: 1, attack: 0.002, decay: 0.45 });
    noise(c, t, { type: "lowpass", freq: 900, sweepTo: 120, peak: 0.7, attack: 0.001, decay: 0.3 });
    tone(c, t + 0.02, { type: "square", from: 70, to: 40, peak: 0.12, decay: 0.2 });
  },
  reaction: (c, t) => {
    const variant = Math.floor(Math.random() * 3);
    if (variant === 0) {
      // boing
      tone(c, t, { type: "triangle", from: 180, to: 520, peak: 0.25, decay: 0.4, glide: 0.12, vibrato: 18 });
    } else if (variant === 1) {
      // slide whistle down
      tone(c, t, { type: "sine", from: 1400, to: 300, peak: 0.18, decay: 0.45 });
    } else {
      // "wah-wah" squeak
      tone(c, t, { type: "sawtooth", from: 700, to: 380, peak: 0.08, decay: 0.18 });
      tone(c, t + 0.2, { type: "sawtooth", from: 600, to: 300, peak: 0.08, decay: 0.25 });
    }
  },
  reset: (c, t) => {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(c, t + i * 0.07, { type: "triangle", from: f, peak: 0.18, decay: 0.25 }));
  },
  ready: (c, t) => {
    [659.25, 987.77].forEach((f, i) => tone(c, t + i * 0.09, { type: "sine", from: f, peak: 0.18, decay: 0.3 }));
  },
  error: (c, t) => {
    tone(c, t, { type: "square", from: 220, to: 160, peak: 0.08, decay: 0.3 });
  },
};

export function playSound(name: SoundName, delayMs = 0) {
  if (!ctx || ctx.state !== "running") return;
  try {
    players[name](ctx, ctx.currentTime + delayMs / 1000);
  } catch {
    /* audio is best-effort */
  }
}
