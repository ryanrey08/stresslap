"use client";

/* eslint-disable @next/next/no-img-element -- local blob: URLs */
import { useState, type DragEvent } from "react";
import { ImagePlus, ShieldCheck, Trash2, Upload } from "lucide-react";
import type { DetectedFace, LoadedImage } from "@/types";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
export const MAX_FILE_MB = 10;

/** Returns an error message, or null if the file is acceptable. */
export function validateImageFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const okType = ACCEPTED_TYPES.includes(file.type) || ["jpg", "jpeg", "png", "webp"].includes(ext);
  if (!okType) return "That file type isn't supported. Please choose a JPG, JPEG, PNG, or WEBP image.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `That image is over ${MAX_FILE_MB} MB. Please pick a smaller one.`;
  if (file.size === 0) return "That file is empty. Please pick another image.";
  return null;
}

interface ImageUploaderProps {
  image: LoadedImage | null;
  faces: DetectedFace[];
  selectedFace: number;
  onSelectFace: (id: number) => void;
  onFile: (file: File) => void;
  onBrowse: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImageUploader({ image, faces, selectedFace, onSelectFace, onFile, onBrowse, onRemove, disabled }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <section className="card flex flex-col gap-4 p-5" aria-label="Photo upload">
      <h2 className="font-display text-2xl tracking-wide text-yellow-300">1. Upload a photo</h2>

      {!image ? (
        <div
          role="button"
          tabIndex={0}
          onClick={onBrowse}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onBrowse()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed px-4 py-10 text-center transition ${
            dragging ? "scale-[1.02] border-yellow-300 bg-yellow-300/15" : "border-white/30 bg-white/5 hover:border-pink-300 hover:bg-white/10"
          }`}
        >
          <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 shadow-lg transition group-hover:rotate-12 group-hover:scale-110">
            <ImagePlus className="size-8 text-white" />
          </div>
          <p className="text-lg font-extrabold">Drag &amp; drop a photo here</p>
          <p className="text-sm text-white/70">or</p>
          <span className="btn-primary pointer-events-none">
            <Upload className="size-4" /> Browse photos
          </span>
          <p className="text-xs text-white/60">JPG, JPEG, PNG or WEBP · up to {MAX_FILE_MB} MB</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl border-2 border-white/20 bg-black/30">
            <img src={image.url} alt="Preview of your uploaded photo with detected faces outlined" className="block h-auto w-full" draggable={false} />
            {faces.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFace(f.id)}
                disabled={disabled}
                aria-label={`Select face ${i + 1}`}
                className={`absolute rounded-lg border-[3px] transition ${
                  f.id === selectedFace ? "border-yellow-300 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]" : "border-white/70 border-dashed hover:border-pink-300"
                }`}
                style={{
                  left: `${(f.box.x / image.width) * 100}%`,
                  top: `${(f.box.y / image.height) * 100}%`,
                  width: `${(f.box.w / image.width) * 100}%`,
                  height: `${(f.box.h / image.height) * 100}%`,
                }}
              >
                {faces.length > 1 && (
                  <span className="absolute -top-3 -left-3 grid size-6 place-items-center rounded-full bg-yellow-300 text-xs font-black text-purple-900">
                    {i + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="truncate text-xs text-white/60" title={image.name}>
            {image.name} · {image.width}×{image.height}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onBrowse} className="btn-secondary" disabled={disabled}>
              <Upload className="size-4" /> Another
            </button>
            <button type="button" onClick={onRemove} className="btn-danger" disabled={disabled}>
              <Trash2 className="size-4" /> Remove
            </button>
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-emerald-400/15 p-3 text-xs text-emerald-100">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Your photo stays on your device. Face detection runs right here in your browser, and nothing is uploaded or stored.
      </p>
    </section>
  );
}
