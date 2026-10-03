import Image from "next/image";
import type { BlogMedia as BlogMediaItem } from "@ecommerce/contracts";

// Renders one uploaded blog image or video, filling its (relative) parent.
export function BlogMedia({
  media,
  alt,
  preview = false,
  priority = false,
}: {
  media: BlogMediaItem;
  alt: string;
  /** Card thumbnail: muted, looping, no controls. */
  preview?: boolean;
  priority?: boolean;
}) {
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        className="absolute inset-0 h-full w-full object-cover"
        preload="metadata"
        playsInline
        {...(preview
          ? { muted: true, loop: true, autoPlay: true, "aria-hidden": true }
          : { controls: true, "aria-label": alt })}
      />
    );
  }
  return (
    <Image
      src={media.url}
      alt={alt}
      fill
      priority={priority}
      className="object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}
