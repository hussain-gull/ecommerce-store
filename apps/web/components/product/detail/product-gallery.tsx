"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { GalleryMedia } from "@ecommerce/contracts";
import { Lightbox } from "./lightbox";
import { MediaThumbnail } from "./media-thumbnail";
import { ProductImageStage } from "./product-image-stage";

// 5s: long enough to actually look at a shoe before it moves on, short enough
// that a shopper flicking through sees every angle without touching an arrow.
const AUTOPLAY_MS = 5000;

type ProductGalleryProps = {
  media: GalleryMedia[];
  name: string;
  /** Percentage off, rendered as the corner badge. Falsy = no badge. */
  discount?: number;
};

// Autoplay shouldn't silently swap the shopper onto a video mid-rotation —
// walk forward to the next image slide, wrapping around, skipping any video.
function nextImageIndex(media: GalleryMedia[], from: number) {
  for (let step = 1; step <= media.length; step++) {
    const i = (from + step) % media.length;
    if (media[i]?.type !== "video") return i;
  }
  return (from + 1) % media.length;
}

export function ProductGallery({ media, name, discount }: ProductGalleryProps) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const isVideoActive = media[idx]?.type === "video";

  function go(delta: number) {
    setIdx((i) => (i + delta + media.length) % media.length);
  }

  // Autoplay — restarts on any manual change, so a click always buys a full
  // interval. Paused outright while a video slide is showing.
  useEffect(() => {
    if (paused || lightbox || isVideoActive || media.length < 2) return;
    const t = setInterval(
      () => setIdx((i) => nextImageIndex(media, i)),
      AUTOPLAY_MS,
    );
    return () => clearInterval(t);
  }, [idx, paused, lightbox, isVideoActive, media]);

  // Keep the active thumbnail in view once the rail overflows.
  useEffect(() => {
    thumbsRef.current?.children[idx]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [idx]);

  return (
    <div className="flex gap-4">
      {media.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex flex-col gap-4 w-[100px] shrink-0 self-start max-h-[560px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {media.map((item, i) => (
            <button
              key={item.src}
              onClick={() => setIdx(i)}
              aria-label={`View ${item.type} ${i + 1}`}
              aria-current={i === idx}
              className={`relative w-[100px] h-[100px] shrink-0 bg-wash cursor-pointer overflow-hidden p-0 border-2 transition-all ${i === idx ? "border-accent" : "border-transparent opacity-80 hover:opacity-100"}`}
            >
              <MediaThumbnail media={item} />
            </button>
          ))}
        </div>
      )}

      <ProductImageStage
        media={media}
        name={name}
        idx={idx}
        discount={discount}
        onPauseChange={setPaused}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onExpand={() => setLightbox(true)}
      />

      <AnimatePresence>
        {lightbox && (
          <Lightbox
            media={media}
            name={name}
            index={idx}
            onIndexChange={setIdx}
            onClose={() => setLightbox(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
