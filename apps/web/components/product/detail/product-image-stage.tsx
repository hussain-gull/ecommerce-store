"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, ChevronsRight, Expand } from "lucide-react";
import { GlassMagnifier } from "react-image-magnifiers";
import type { GalleryMedia } from "@ecommerce/contracts";

type ProductImageStageProps = {
  media: GalleryMedia[];
  name: string;
  idx: number;
  discount?: number;
  onPauseChange: (paused: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onExpand: () => void;
};

// Zoom level = size ratio between the small (rendered) and large (magnified)
// image — react-image-magnifiers has no zoomFactor prop. Capping the large
// image's width via a Cloudinary transform keeps that ratio (and therefore
// the zoom) modest instead of using the full-resolution source.
const MAGNIFIER_ZOOM_WIDTH_PX = 600;

function magnifierLargeSrc(src: string): string {
  return src.replace("/upload/", `/upload/w_${MAGNIFIER_ZOOM_WIDTH_PX}/`);
}

/** The large crossfading image/video, its magnify lens, nav arrows and expand button. */
export function ProductImageStage({
  media,
  name,
  idx,
  discount,
  onPauseChange,
  onPrev,
  onNext,
  onExpand,
}: ProductImageStageProps): React.ReactElement {
  const frameRef = useRef<HTMLDivElement>(null);
  const active = media[idx];

  return (
    <div
      ref={frameRef}
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
      className="relative shrink-0 self-start bg-wash overflow-hidden w-full aspect-square md:w-[560px] md:h-[560px] cursor-pointer"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {active?.type === "video" ? (
            <video
              src={active.src}
              poster={active.poster}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <GlassMagnifier
              imageSrc={active?.src ?? ""}
              largeImageSrc={
                active?.src ? magnifierLargeSrc(active.src) : undefined
              }
              imageAlt={name}
              className="w-full h-full [&_img]:max-w-none [&>img]:object-contain [&>img]:p-5 [&>img]:h-full"
              cursorStyle="none"
              allowOverflow
              square={false}
              magnifierSize="150px"
              magnifierBorderColor="rgba(255,255,255,.5)"
              magnifierBorderSize={3}
              magnifierBackgroundColor="rgba(225,225,225,.5)"
              magnifierOffsetX={0}
              magnifierOffsetY={0}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {Boolean(discount) && (
        <span className="absolute top-3 right-3 z-2 w-14 h-14 rounded-full bg-accent text-wash text-[13px] font-bold flex items-center justify-center">
          -{discount}%
        </span>
      )}

      {media.length > 1 && (
        <>
          <NavArrow direction="left" onClick={onPrev} />
          <NavArrow direction="right" onClick={onNext} />
        </>
      )}

      {active?.type !== "video" && (
        <button
          onClick={onExpand}
          aria-label="View full screen"
          className="absolute bottom-4 right-4 z-2 w-11 h-11 rounded-full border border-wash/70 bg-wash/70 backdrop-blur-md text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.12)] flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-foreground hover:text-white hover:scale-110 active:scale-95"
        >
          <Expand size={18} />
        </button>
      )}
    </div>
  );
}

function NavArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronsLeft : ChevronsRight;
  const nudge =
    direction === "left"
      ? "group-hover/arrow:-translate-x-0.5"
      : "group-hover/arrow:translate-x-0.5";

  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Previous image" : "Next image"}
      className={`group/arrow absolute ${direction === "left" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 z-2 w-10 h-10 rounded-full border border-white/70 bg-white/60 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.12)] flex items-center justify-center overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95`}
    >
      <span className="absolute inset-0 scale-0 rounded-full bg-accent transition-transform duration-300 group-hover/arrow:scale-100" />
      <Icon
        size={18}
        strokeWidth={2.5}
        className={`relative z-1 text-foreground transition-all duration-300 group-hover/arrow:text-white ${nudge}`}
      />
    </button>
  );
}
