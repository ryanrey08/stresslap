"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectFaces, loadFaceLandmarker } from "@/lib/faceDetection";
import type { DetectedFace, DetectionStatus, LoadedImage } from "@/types";

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.naturalWidth > 0 ? resolve(img) : reject(new Error("empty image")));
    img.onerror = () => reject(new Error("decode failed"));
    img.src = url;
  });
}

/** Loads a local image file, then finds faces in it — all in the browser. */
export function useFaceDetection() {
  const [status, setStatus] = useState<DetectionStatus>("empty");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);
  const urlRef = useRef<string | null>(null);

  // Warm up the model in the background so the first detection is quick.
  useEffect(() => {
    const t = window.setTimeout(() => void loadFaceLandmarker().catch(() => {}), 800);
    return () => window.clearTimeout(t);
  }, []);

  const releaseUrl = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  useEffect(() => releaseUrl, []);

  const clear = useCallback(() => {
    runId.current++;
    releaseUrl();
    setImage(null);
    setFaces([]);
    setError(null);
    setStatus("empty");
  }, []);

  const fail = useCallback((message: string) => {
    setFaces([]);
    setError(message);
    setStatus("error");
  }, []);

  const processFile = useCallback(async (file: File): Promise<DetectedFace[] | null> => {
    const id = ++runId.current;
    releaseUrl();
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setFaces([]);
    setError(null);
    setImage(null);
    setStatus("loading-image");

    let el: HTMLImageElement;
    try {
      el = await loadImageElement(url);
    } catch {
      if (id !== runId.current) return null;
      releaseUrl();
      fail("We couldn't open that image. It may be damaged or in an unsupported format. Please try another photo.");
      return null;
    }
    if (id !== runId.current) return null;
    setImage({ url, name: file.name, width: el.naturalWidth, height: el.naturalHeight });
    setStatus("detecting");

    try {
      const found = await detectFaces(el);
      if (id !== runId.current) return null;
      setFaces(found);
      setStatus(found.length ? "ready" : "no-face");
      return found;
    } catch (err) {
      console.warn("Face detection failed", err);
      if (id !== runId.current) return null;
      fail("Face detection couldn't start in this browser. Please refresh the page and try again.");
      return null;
    }
  }, [fail]);

  return { status, image, faces, error, processFile, clear, setError: fail };
}
