"use client";

import { Eraser, ImageUp, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { SoundToggle } from "./SoundController";

interface ControlPanelProps {
  onUndo: () => void;
  onClear: () => void;
  onReset: () => void;
  onUploadAnother: () => void;
  onRemove: () => void;
  hasImage: boolean;
  hasEffects: boolean;
  canReset: boolean;
}

export function ControlPanel({ onUndo, onClear, onReset, onUploadAnother, onRemove, hasImage, hasEffects, canReset }: ControlPanelProps) {
  return (
    <section className="card flex flex-wrap items-center justify-center gap-3 p-4" aria-label="Controls">
      <button type="button" onClick={onUndo} disabled={!hasEffects} className="btn-secondary" aria-keyshortcuts="Control+Z Meta+Z">
        <Undo2 className="size-4" /> Undo last action
      </button>
      <button type="button" onClick={onClear} disabled={!hasEffects} className="btn-secondary">
        <Eraser className="size-4" /> Clear all effects
      </button>
      <button type="button" onClick={onReset} disabled={!canReset} className="btn-secondary">
        <RotateCcw className="size-4" /> Reset session
      </button>
      <button type="button" onClick={onUploadAnother} className="btn-primary">
        <ImageUp className="size-4" /> Upload new photo
      </button>
      <button type="button" onClick={onRemove} disabled={!hasImage} className="btn-danger">
        <Trash2 className="size-4" /> Remove photo
      </button>
      <SoundToggle />
    </section>
  );
}
