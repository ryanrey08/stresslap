"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ActionButtons } from "./ActionButtons";
import { ControlPanel } from "./ControlPanel";
import { FaceDetector } from "./FaceDetector";
import { ActionHistory } from "./ActionHistory";
import { FacePreview } from "./FacePreview";
import { FinalImagePreview } from "./FinalImagePreview";
import { ImageUploader, ACCEPT_ATTR, validateImageFile } from "./ImageUploader";
import { InteractionStats } from "./InteractionStats";
import { ReactionMessage } from "./ReactionMessage";
import { useSound } from "./SoundController";
import { useActionSequencer, type ActiveAction } from "@/hooks/useActionSequencer";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { usePersistentEffects } from "@/hooks/usePersistentEffects";
import { ACTIONS, ACTION_TYPES, IDLE_MESSAGES, MILESTONE_MESSAGES, pick, randomSide } from "@/lib/actions";
import { createEffect, hitPointImg } from "@/lib/effects";
import { computeGeometry } from "@/lib/geometry";
import type { ActionType, DetectedFace, InteractionStats as Stats, LoadedImage, Point, Side } from "@/types";

const largestFace = (faces: DetectedFace[]) => faces.reduce((a, b) => (b.box.w * b.box.h > a.box.w * a.box.h ? b : a));

export function StressLapApp() {
  const detection = useFaceDetection();
  const { status, image, faces } = detection;
  const sound = useSound();
  const fileInput = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState(0);
  const [message, setMessage] = useState({ text: "Upload a photo to get started!", key: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const lastSlapSide = useRef<Side>("left");

  // Layer 2: permanent effects, kept apart from the temporary animation state below.
  const fx = usePersistentEffects(image);
  const { effects } = fx;
  const effectsRef = useRef(effects);
  useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);
  // Counters are derived from the effect list, so undo / clear can never put them out of sync.
  const stats = useMemo<Stats>(
    () => effects.reduce((s, e) => ({ ...s, [e.type]: s[e.type] + 1 }), { slap: 0, punch: 0, kick: 0 }),
    [effects],
  );
  const stageImage = useMemo<LoadedImage | null>(
    () => (image && fx.compositeUrl ? { ...image, url: fx.compositeUrl } : image),
    [image, fx.compositeUrl],
  );

  const face = useMemo(() => faces.find((f) => f.id === selectedId) ?? faces[0] ?? null, [faces, selectedId]);
  const geo = useMemo(() => (image && face ? computeGeometry(image, face) : null), [image, face]);
  const ready = status === "ready" && !!face && !!geo;

  const say = useCallback((text: string) => setMessage((m) => ({ text, key: m.key + 1 })), []);

  const nextEffectId = useRef(1);
  const addPermanentEffect = useCallback(
    (a: ActiveAction) => {
      if (!face || !geo) return;
      // a tap target is in stage %, convert back to image px
      const base: Point = a.target
        ? { x: geo.crop.x + (a.target.x / 100) * geo.crop.w, y: geo.crop.y + (a.target.y / 100) * geo.crop.h }
        : hitPointImg(a.type, a.side, face);
      fx.add(createEffect(nextEffectId.current++, a.type, a.side, face, base, effectsRef.current));
    },
    [face, geo, fx],
  );

  const sequencer = useActionSequencer({
    onStart: () => sound.play("whoosh"),
    onImpact: (a) => {
      sound.play(a.type);
      sound.play("reaction", 160);
      say(MILESTONE_MESSAGES[effectsRef.current.length + 1] ?? pick(ACTIONS[a.type].messages, message.text));
      addPermanentEffect(a);
    },
  });
  const { cancel, trigger, isBusy, phase, active } = sequencer;

  const runAction = useCallback(
    (type: ActionType, target?: Point, sideOverride?: Side) => {
      if (!ready || isBusy) return;
      sound.unlock();
      let side = sideOverride ?? randomSide();
      if (type === "slap" && !sideOverride) {
        side = lastSlapSide.current === "left" ? "right" : "left";
        lastSlapSide.current = side;
      }
      trigger(type, side, pick(ACTIONS[type].burstWords), target);
    },
    [ready, isBusy, sound, trigger],
  );

  const runRandom = useCallback(() => runAction(pick(ACTION_TYPES)), [runAction]);

  const browse = useCallback(() => {
    sound.unlock();
    fileInput.current?.click();
  }, [sound]);

  const { clear: clearEffects, undo: undoEffect } = fx;
  const resetSession = useCallback(() => {
    cancel();
    clearEffects();
    lastSlapSide.current = "left";
  }, [cancel, clearEffects]);

  const handleFile = useCallback(
    async (file: File) => {
      sound.unlock();
      const err = validateImageFile(file);
      if (err) {
        setUploadError(err);
        sound.play("error");
        return;
      }
      setUploadError(null);
      resetSession();
      say("Scanning for faces...");
      const found = await detection.processFile(file);
      if (!found) return;
      if (found.length === 0) {
        sound.play("error");
        say("No face found. Try another photo!");
        return;
      }
      setSelectedId(largestFace(found).id);
      sound.play("ready");
      say(found.length > 1 ? `${found.length} faces found! Pick your target.` : "Target acquired! Pick a move.");
    },
    [detection, resetSession, say, sound],
  );

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) void handleFile(file);
  };

  const reset = useCallback(() => {
    sound.unlock();
    resetSession();
    if (faces.length) setSelectedId(largestFace(faces).id);
    sound.play("reset");
    say("Fresh face, fully restored!");
  }, [faces, resetSession, say, sound]);

  const undo = useCallback(() => {
    if (!effectsRef.current.length) return;
    sound.unlock();
    undoEffect();
    sound.play("reset");
    say("Rewind! The last hit never happened.");
  }, [say, sound, undoEffect]);

  const clearAll = useCallback(() => {
    if (!effectsRef.current.length) return;
    sound.unlock();
    clearEffects();
    sound.play("reset");
    say("All marks wiped. Squeaky clean!");
  }, [clearEffects, say, sound]);

  const download = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await fx.download();
      say(effectsRef.current.length ? "Masterpiece saved! Frame it." : "Saved! (It's still spotless, though.)");
    } catch (err) {
      console.warn("Download failed", err);
      say("Couldn't save the image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [downloading, fx, say]);

  const remove = useCallback(() => {
    resetSession();
    detection.clear();
    setUploadError(null);
    say("Photo removed. Upload a new one any time!");
  }, [detection, resetSession, say]);

  const selectFace = useCallback(
    (id: number) => {
      if (isBusy) return;
      setSelectedId(id); // marks stay: they live on the photo, not on one face
      say(pick(IDLE_MESSAGES));
    },
    [isBusy, say],
  );

  // keyboard shortcuts: S / P / K, Space = random
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const map: Record<string, ActionType> = { s: "slap", p: "punch", k: "kick" };
      if (map[key]) runAction(map[key]);
      else if (key === " " && !t?.closest("button, a, [role=button]")) {
        e.preventDefault();
        runRandom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runAction, runRandom, undo]);

  return (
    <div id="home" className="mx-auto flex max-w-7xl scroll-mt-24 flex-col gap-6 px-4 pt-8">
      <input ref={fileInput} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={onInputChange} data-testid="file-input" />

      <div className="text-center">
        <h1 className="font-display">
          <span className="anim-wiggle-slow inline-block text-6xl tracking-wide drop-shadow-[0_6px_0_rgba(0,0,0,0.3)] sm:text-7xl">
            Stress<span className="text-yellow-300">Lap</span>
          </span>
          <span className="mt-1 block text-2xl tracking-wide text-pink-200 sm:text-3xl">Release Your Stress, One Slap at a Time!</span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
          Upload a photo, we find the face, and you unleash cartoon slaps, punches and kicks. The face reacts to every hit with
          wobbles, wide eyes, dropped jaws and comic sound effects. StressLap is a free online stress relief game and funny
          face reaction game that runs entirely in your browser, just for fun.
        </p>
      </div>

      {uploadError && (
        <div role="alert" className="card flex items-start gap-3 border-orange-300/50 p-4">
          <AlertTriangle className="size-5 shrink-0 text-orange-300" />
          <p className="flex-1 text-sm">{uploadError}</p>
          <button type="button" onClick={() => setUploadError(null)} aria-label="Dismiss" className="rounded-full p-1 hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_260px]">
        <div className="order-3 flex flex-col gap-4 lg:order-1">
          <ImageUploader
            image={image}
            faces={status === "ready" ? faces : []}
            selectedFace={face?.id ?? -1}
            onSelectFace={selectFace}
            onFile={(f) => void handleFile(f)}
            onBrowse={browse}
            onRemove={remove}
            disabled={isBusy}
          />
          <FaceDetector
            status={status}
            image={image}
            faces={faces}
            selectedFace={face?.id ?? -1}
            onSelectFace={selectFace}
            onBrowse={browse}
            error={detection.error}
            disabled={isBusy}
          />
        </div>

        <div className="order-1 mx-auto w-full max-w-[640px] lg:order-2">
          <FacePreview
            image={stageImage}
            face={face}
            status={status}
            phase={phase}
            active={active}
            onTap={ready ? (at, side) => runAction("punch", at, side) : undefined}
          />
        </div>

        <div className="order-2 lg:order-3">
          <ActionButtons onAction={runAction} onRandom={runRandom} disabled={!ready || isBusy} busy={isBusy} activeType={active?.type} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <InteractionStats stats={stats} />
        <div className="flex flex-col gap-6">
          <ReactionMessage message={message.text} messageKey={message.key} />
          <ControlPanel
            onUndo={undo}
            onClear={clearAll}
            onReset={reset}
            onUploadAnother={browse}
            onRemove={remove}
            hasImage={!!image}
            hasEffects={effects.length > 0}
            canReset={ready}
          />
        </div>
      </div>

      <div id="final-image" className="grid scroll-mt-24 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <FinalImagePreview
          image={status === "ready" ? image : null}
          compositeUrl={fx.compositeUrl}
          effectCount={effects.length}
          onDownload={() => void download()}
          downloading={downloading}
        />
        <ActionHistory effects={effects} />
      </div>
    </div>
  );
}
