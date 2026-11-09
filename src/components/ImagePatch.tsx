/* eslint-disable @next/next/no-img-element -- local blob: URLs, next/image can't optimise them */
import type { CSSProperties } from "react";
import type { LoadedImage, Rect } from "@/types";

interface ImagePatchProps {
  image: LoadedImage;
  /** Region of the photo to show, in image pixels. */
  region: Rect;
  className?: string;
  style?: CSSProperties;
  /** Soft elliptical edge so warped patches blend into the photo. */
  feather?: boolean;
}

/**
 * Shows one rectangular region of the photo, scaled to fill this element.
 * Everything is in percentages, so it stays correct at any screen size.
 */
export function ImagePatch({ image, region, className = "", style, feather }: ImagePatchProps) {
  const mask = feather ? "radial-gradient(closest-side, #000 55%, transparent 100%)" : undefined;
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ ...style, maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
    >
      <img
        src={image.url}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          left: `${(-region.x / region.w) * 100}%`,
          top: `${(-region.y / region.h) * 100}%`,
          width: `${(image.width / region.w) * 100}%`,
          height: `${(image.height / region.h) * 100}%`,
        }}
      />
    </div>
  );
}
