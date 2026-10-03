import { useRef, useState } from "react";
import { Loader2Icon, PlayIcon, Trash2Icon, UploadIcon } from "lucide-react";
import type { BlogMedia, MediaCategory } from "@ecommerce/contracts";
import { uploadMediaApi } from "@/lib/api/media.api";
import { useToastStore } from "@/lib/store/toast.store";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "./image-lightbox";

// Ordered list of uploaded images/videos. Upload endpoint is picked per file
// type by uploadMediaApi.
export function MediaListField({
  category,
  value,
  onChange,
  max,
}: {
  category: MediaCategory;
  value: BlogMedia[];
  onChange: (media: BlogMedia[]) => void;
  max: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const push = useToastStore((s) => s.push);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadMediaApi(file, category);
      const type = file.type.startsWith("video/") ? "video" : "image";
      onChange([...value, { type, url }]);
      push("success", "File uploaded — click Save changes to publish it.");
    } catch (err) {
      push("error", (err as { message?: string })?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((m, i) => (
            <div key={m.url} className="relative">
              {m.type === "image" ? (
                <button
                  type="button"
                  onClick={() => setPreview(m.url)}
                  aria-label="View full image"
                  className="border-none bg-transparent p-0 cursor-pointer"
                >
                  <img
                    src={m.url}
                    alt=""
                    className="h-16 w-16 rounded-md object-cover ring-1 ring-border"
                  />
                </button>
              ) : (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open video"
                  className="relative block h-16 w-16 overflow-hidden rounded-md ring-1 ring-border"
                >
                  <video
                    src={m.url}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <PlayIcon className="absolute inset-0 m-auto size-5 text-white drop-shadow" />
                </a>
              )}
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 rounded-b-md bg-black/60 text-center text-[10px] text-white">
                  Cover
                </span>
              )}
              <Button
                type="button"
                size="icon-sm"
                variant="destructive"
                className="absolute -right-2 -top-2 size-5 rounded-full"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <Trash2Icon className="size-3" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
      {preview && (
        <ImageLightbox src={preview} onClose={() => setPreview(null)} />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isUploading || value.length >= max}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <UploadIcon />
        )}
        {isUploading ? "Uploading…" : "Upload image or video"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Images up to 8MB, videos (MP4/WEBM/MOV) up to 50MB. The first file is
        the post cover.
      </p>
    </div>
  );
}
