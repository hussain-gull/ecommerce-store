import Image from "next/image";
import { Play } from "lucide-react";
import type { GalleryMedia } from "@ecommerce/contracts";

type MediaThumbnailProps = {
  media: GalleryMedia;
  className?: string;
};

/** Thumbnail fill content — a video shows its poster frame with a play badge. */
export function MediaThumbnail({
  media,
  className = "object-contain p-1",
}: MediaThumbnailProps) {
  const src = media.type === "video" ? media.poster : media.src;

  return (
    <>
      <Image src={src} alt="" fill className={className} unoptimized />
      {media.type === "video" && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Play size={16} className="text-white fill-white" />
        </span>
      )}
    </>
  );
}
