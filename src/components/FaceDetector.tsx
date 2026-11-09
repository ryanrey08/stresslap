"use client";

import { AlertTriangle, Loader2, ScanFace, SearchX, Upload, Users } from "lucide-react";
import { ImagePatch } from "./ImagePatch";
import type { DetectedFace, DetectionStatus, LoadedImage } from "@/types";

interface FaceDetectorProps {
  status: DetectionStatus;
  image: LoadedImage | null;
  faces: DetectedFace[];
  selectedFace: number;
  onSelectFace: (id: number) => void;
  onBrowse: () => void;
  error: string | null;
  disabled?: boolean;
}

/** Face-detection status panel and (for group photos) the face picker. */
export function FaceDetector({ status, image, faces, selectedFace, onSelectFace, onBrowse, error, disabled }: FaceDetectorProps) {
  if (status === "empty") return null;

  if (status === "loading-image" || status === "detecting") {
    return (
      <div className="card flex items-center gap-3 p-4" role="status" aria-live="polite">
        <Loader2 className="size-6 animate-spin text-yellow-300" />
        <div>
          <p className="font-bold">{status === "loading-image" ? "Opening your photo..." : "Hunting for faces..."}</p>
          <p className="text-xs text-white/70">Running locally in your browser</p>
        </div>
      </div>
    );
  }

  if (status === "no-face" || status === "error") {
    const noFace = status === "no-face";
    return (
      <div className="card flex flex-col gap-3 border-orange-300/50 p-4" role="alert">
        <div className="flex items-start gap-3">
          {noFace ? <SearchX className="size-6 shrink-0 text-orange-300" /> : <AlertTriangle className="size-6 shrink-0 text-orange-300" />}
          <div>
            <p className="font-bold">{noFace ? "Hmm, no face found!" : "Oops!"}</p>
            <p className="text-sm text-white/80">
              {noFace
                ? "We couldn't spot a face in that photo. Try a clear, well-lit picture where the face is facing the camera."
                : error}
            </p>
          </div>
        </div>
        <button type="button" onClick={onBrowse} className="btn-primary self-start">
          <Upload className="size-4" /> Upload another photo
        </button>
      </div>
    );
  }

  // ready
  return (
    <div className="card flex flex-col gap-3 p-4" aria-live="polite">
      <p className="flex items-center gap-2 font-bold">
        {faces.length > 1 ? <Users className="size-5 text-yellow-300" /> : <ScanFace className="size-5 text-yellow-300" />}
        {faces.length === 1 ? "Face detected!" : `${faces.length} faces detected. Pick your target:`}
      </p>
      {faces.length > 1 && image && (
        <div className="flex flex-wrap gap-2">
          {faces.map((f, i) => {
            const s = Math.max(f.box.w, f.box.h) * 1.3;
            const region = { x: f.box.x + f.box.w / 2 - s / 2, y: f.box.y + f.box.h / 2 - s / 2, w: s, h: s };
            const selected = f.id === selectedFace;
            return (
              <button
                key={f.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectFace(f.id)}
                aria-pressed={selected}
                aria-label={`Face ${i + 1}`}
                className={`relative size-16 overflow-hidden rounded-2xl border-[3px] transition hover:scale-105 disabled:opacity-60 ${
                  selected ? "border-yellow-300 ring-4 ring-yellow-300/30" : "border-white/30"
                }`}
              >
                <ImagePatch image={image} region={region} className="absolute inset-0" />
                <span className="absolute right-0.5 bottom-0.5 rounded-full bg-black/60 px-1.5 text-[10px] font-black">{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
