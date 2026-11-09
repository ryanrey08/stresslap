"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canvasToBlob, finalImageFilename, loadImageEl, renderComposite, type PersistentEffect } from "@/lib/effects";
import type { LoadedImage } from "@/types";

/** Longest side of the live preview composite. The download is rendered separately at full size. */
const PREVIEW_MAX_SIDE = 1600;

/**
 * Keeps the permanent effect list for the current photo and a live composite
 * (original photo + all effects) used by the stage and the final preview.
 * The original photo is never modified.
 */
export function usePersistentEffects(image: LoadedImage | null) {
  const [effects, setEffects] = useState<PersistentEffect[]>([]);
  const [composite, setComposite] = useState<{ src: string; url: string } | null>(null);
  const baseRef = useRef<{ src: string; el: Promise<HTMLImageElement> } | null>(null);
  const ownedUrl = useRef<string | null>(null);
  const renderId = useRef(0);

  const getBase = useCallback((img: LoadedImage) => {
    if (baseRef.current?.src !== img.url) baseRef.current = { src: img.url, el: loadImageEl(img.url) };
    return baseRef.current.el;
  }, []);

  const releaseLater = (url: string | null) => {
    // give <img> elements a moment to switch over before freeing the old blob
    if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  // Re-render the composite whenever the photo or the effects change.
  useEffect(() => {
    const id = ++renderId.current;
    if (!image || effects.length === 0) {
      releaseLater(ownedUrl.current);
      ownedUrl.current = null;
      setComposite(null);
      return;
    }
    void (async () => {
      try {
        const base = await getBase(image);
        if (id !== renderId.current) return;
        const canvas = renderComposite(base, image, effects, PREVIEW_MAX_SIDE);
        const blob = await canvasToBlob(canvas, "image/webp", 0.95); // falls back to PNG where WebP encoding isn't supported
        if (id !== renderId.current) return;
        const url = URL.createObjectURL(blob);
        await loadImageEl(url).catch(() => undefined); // decode before swapping, so nothing flickers
        if (id !== renderId.current) {
          URL.revokeObjectURL(url);
          return;
        }
        releaseLater(ownedUrl.current);
        ownedUrl.current = url;
        setComposite({ src: image.url, url });
      } catch (err) {
        console.warn("Could not render effects", err);
      }
    })();
  }, [image, effects, getBase]);

  useEffect(
    () => () => {
      renderId.current++;
      if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    },
    [],
  );

  const add = useCallback((e: PersistentEffect) => setEffects((list) => [...list, e]), []);
  const undo = useCallback(() => setEffects((list) => list.slice(0, -1)), []);
  const clear = useCallback(() => setEffects([]), []);

  /** Full-resolution PNG of the original photo with every permanent effect drawn on it. */
  const download = useCallback(async () => {
    if (!image) return null;
    const base = await getBase(image);
    const canvas = renderComposite(base, image, effects);
    const blob = await canvasToBlob(canvas, "image/png");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalImageFilename();
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000); // mobile browsers read the blob lazily
    return { width: canvas.width, height: canvas.height, bytes: blob.size };
  }, [image, effects, getBase]);

  // Only expose a composite that belongs to the current photo and is up to date.
  const compositeUrl = image && effects.length > 0 && composite?.src === image.url ? composite.url : null;

  return { effects, add, undo, clear, download, compositeUrl };
}
