"use client";

/* eslint-disable @next/next/no-img-element -- local blob: URLs */
import { Download, ImageIcon, Loader2 } from "lucide-react";
import { exportScale } from "@/lib/effects";
import type { LoadedImage } from "@/types";

interface FinalImagePreviewProps {
  image: LoadedImage | null;
  /** Composite of the photo + all permanent effects, or null when there are no effects yet. */
  compositeUrl: string | null;
  effectCount: number;
  onDownload: () => void;
  downloading: boolean;
  disabled?: boolean;
}

export function FinalImagePreview({ image, compositeUrl, effectCount, onDownload, downloading, disabled }: FinalImagePreviewProps) {
  const scale = image ? exportScale(image) : 1;
  const outW = image ? Math.round(image.width * scale) : 0;
  const outH = image ? Math.round(image.height * scale) : 0;
  const src = compositeUrl ?? image?.url;

  return (
    <section className="card flex flex-col gap-4 p-5" aria-label="Final image preview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide text-yellow-300">3. Your masterpiece</h2>
        {image && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80" data-testid="effect-count">
            {effectCount} {effectCount === 1 ? "mark" : "marks"}
          </span>
        )}
      </div>

      <div className="relative grid min-h-48 place-items-center overflow-hidden rounded-2xl bg-black/30 p-2">
        {src ? (
          <img
            src={src}
            alt={effectCount ? `Your photo with ${effectCount} cartoon marks` : "Your original photo"}
            className="max-h-[420px] w-auto max-w-full rounded-xl object-contain shadow-lg"
            data-testid="final-preview-img"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-white/60">
            <ImageIcon className="size-10" />
            <p className="text-sm">Every slap, punch and kick sticks here. Upload a photo to begin.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled || !image || downloading}
        className="btn-primary py-3.5 text-base tracking-wide"
        data-testid="download-final"
      >
        {downloading ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
        DOWNLOAD FINAL IMAGE
      </button>
      {image && (
        <p className="-mt-2 text-center text-xs text-white/60">
          PNG, {outW} × {outH}px{scale < 1 ? " (scaled to fit browser limits)" : ", full original size"}. Made on your device.
        </p>
      )}
    </section>
  );
}
