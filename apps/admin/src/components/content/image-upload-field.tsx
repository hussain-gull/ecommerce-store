import { useRef, useState } from "react";
import { Loader2Icon, UploadIcon } from "lucide-react";
import type { MediaCategory } from "@ecommerce/contracts";
import { uploadMediaApi } from "@/lib/api/media.api";
import { useToastStore } from "@/lib/store/toast.store";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "./image-lightbox";

export function ImageUploadField({
  category,
  value,
  onChange,
}: {
  category: MediaCategory;
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const push = useToastStore((s) => s.push);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadMediaApi(file, category);
      onChange(url);
      push("success", "Image uploaded — click Save changes to publish it.");
    } catch {
      push("error", "Image upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value && (
        <button
          type="button"
          onClick={() => setShowLightbox(true)}
          aria-label="View full image"
          className="border-none bg-transparent p-0 cursor-pointer"
        >
          <img
            src={value}
            alt=""
            className="h-14 w-14 rounded-md object-cover ring-1 ring-border"
          />
        </button>
      )}
      {showLightbox && value && (
        <ImageLightbox src={value} onClose={() => setShowLightbox(false)} />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <UploadIcon />
        )}
        {isUploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
      </Button>
    </div>
  );
}
