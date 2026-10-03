"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useToastStore } from "@/lib/store/toast.store";
import type { GalleryMedia } from "@ecommerce/contracts";
import { MediaThumbnail } from "./media-thumbnail";

type LightboxProps = {
  media: GalleryMedia[];
  name: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
};

export function Lightbox({
  media,
  name,
  index,
  onIndexChange,
  onClose,
}: LightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const pushToast = useToastStore((s) => s.push);
  const active = media[index];
  const isVideo = active?.type === "video";

  function go(delta: number) {
    setZoomed(false);
    onIndexChange((index + delta + media.length) % media.length);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    function onFsChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.style.overflow = prevOverflow;
    };
  });

  // Zooming grows the image past the viewport — start the user in the middle of it.
  useEffect(() => {
    const el = viewRef.current;
    el?.scrollTo(
      (el.scrollWidth - el.clientWidth) / 2,
      (el.scrollHeight - el.clientHeight) / 2,
    );
  }, [zoomed, index]);

  function toggleFullscreen() {
    const req = document.fullscreenElement
      ? document.exitFullscreen()
      : rootRef.current?.requestFullscreen();
    // Browsers reject this when the gesture isn't trusted or the API is blocked.
    req?.catch(() => pushToast("error", "Full screen is unavailable here"));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      // Cancelling the native sheet rejects — not an error worth surfacing.
      await navigator.share({ title: name, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    pushToast("success", "Link copied to clipboard");
  }

  const iconBtn =
    "text-white/70 hover:text-white bg-transparent border-none cursor-pointer p-1.5 transition-colors";

  return createPortal(
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} images`}
      className="fixed inset-0 z-[9998] bg-black flex flex-col"
    >
      <header className="flex items-center justify-between px-6 py-3 shrink-0">
        <span className="text-white/70 text-sm tabular-nums">
          {index + 1} / {media.length}
        </span>
        <div className="flex items-center gap-4">
          {!isVideo && (
            <button
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "Zoom out" : "Zoom in"}
              aria-pressed={zoomed}
              className={iconBtn}
            >
              {zoomed ? <ZoomOut size={22} /> : <ZoomIn size={22} />}
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
            className={iconBtn}
          >
            {fullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
          </button>
          <button onClick={share} aria-label="Share" className={iconBtn}>
            <Share2 size={22} />
          </button>
          <button onClick={onClose} aria-label="Close" className={iconBtn}>
            <X size={26} />
          </button>
        </div>
      </header>

      <div className="relative flex-1 min-h-0 flex items-center">
        {media.length > 1 && (
          <button
            onClick={() => go(-1)}
            aria-label="Previous image"
            className={`absolute left-4 z-2 ${iconBtn}`}
          >
            <ArrowLeft size={28} />
          </button>
        )}

        {isVideo ? (
          <div
            ref={viewRef}
            className="w-full h-full flex items-center justify-center"
          >
            <video
              src={active.src}
              poster={active.poster}
              controls
              playsInline
              className="max-w-full max-h-full"
            />
          </div>
        ) : (
          <div
            ref={viewRef}
            onClick={() => setZoomed((z) => !z)}
            className={`w-full h-full flex ${zoomed ? "overflow-auto cursor-zoom-out" : "overflow-hidden cursor-zoom-in"}`}
          >
            <div
              className={`relative m-auto shrink-0 ${zoomed ? "w-[200%] h-[200%]" : "w-full h-full"}`}
            >
              <Image
                src={active?.src ?? ""}
                alt={`${name} — image ${index + 1}`}
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
        )}

        {media.length > 1 && (
          <button
            onClick={() => go(1)}
            aria-label="Next image"
            className={`absolute right-4 z-2 ${iconBtn}`}
          >
            <ArrowRight size={28} />
          </button>
        )}
      </div>

      {media.length > 1 && (
        <div className="shrink-0 bg-white/8 flex justify-center gap-1.5 p-2 overflow-x-auto">
          {media.map((item, i) => (
            <button
              key={item.src}
              onClick={() => {
                setZoomed(false);
                onIndexChange(i);
              }}
              aria-label={`View ${item.type} ${i + 1}`}
              aria-current={i === index}
              className={`relative w-22 h-18 shrink-0 cursor-pointer border-none p-0 transition-opacity ${i === index ? "bg-white opacity-100" : "bg-white/60 opacity-70 hover:opacity-100"}`}
            >
              <MediaThumbnail media={item} />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body,
  );
}
