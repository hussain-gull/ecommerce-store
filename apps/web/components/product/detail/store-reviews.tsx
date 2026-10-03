"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import type { ReviewMedia } from "@ecommerce/contracts";
import { useAuthStore } from "@/lib/store/auth.store";
import { Stars } from "@/components/ui/stars";
import {
  useStoreReviews,
  useCreateReview,
  useUploadReviewMedia,
  useDeleteReviewMedia,
} from "@/lib/hooks/use-reviews";
import { useToastStore } from "@/lib/store/toast.store";
import Image from "next/image";
import Link from "next/link";

const MAX_FILES = 6;
const ACCEPTED_EXT = /\.(jpe?g|png|webp|avif|mp4|webm|mov)$/i;

// Reviews are store-wide, not per-product (thrift stock is one-off — see
// apps/web/CONTEXT.md). There's no self-serve order history yet, so eligibility is
// proven with the order reference from the order confirmation, the same
// minimal FK anchor the API already uses to gate creation. One order = one
// review, however many products it contains.
export function StoreReviews() {
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const { data: reviews = [], isLoading, isError, refetch } = useStoreReviews();
  const { mutate: createReview, isPending } = useCreateReview();
  const { mutateAsync: uploadMedia } = useUploadReviewMedia();
  const { mutate: deleteMedia } = useDeleteReviewMedia();

  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (media.length >= MAX_FILES) {
      push("error", `You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const picked = Array.from(files).slice(0, MAX_FILES - media.length);
    setUploading(true);
    for (const file of picked) {
      // Client-side extension allowlist — a cheap first reject; the API
      // re-validates real file bytes (sharp decode / Cloudinary transcode),
      // so this is UX only, not the security boundary.
      if (!ACCEPTED_EXT.test(file.name)) {
        push("error", `${file.name}: unsupported file type.`);
        continue;
      }
      try {
        const uploaded = await uploadMedia(file);
        setMedia((prev) => [
          ...prev,
          {
            type: file.type.startsWith("video/") ? "video" : "image",
            url: uploaded.url,
          },
        ]);
      } catch {
        // useUploadReviewMedia already toasts the error.
      }
    }
    setUploading(false);
  }

  function removeMedia(url: string) {
    setMedia((prev) => prev.filter((m) => m.url !== url));
    deleteMedia(url);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !comment.trim() || !orderId.trim()) return;
    createReview(
      { orderId: orderId.trim(), rating, comment: comment.trim(), media },
      {
        onSuccess: () => {
          setOrderId("");
          setRating(0);
          setComment("");
          setMedia([]);
        },
      },
    );
  }

  return (
    <div>
      {isLoading ? (
        <p>Loading reviews…</p>
      ) : isError ? (
        <p className="mb-6" role="alert">
          We couldn&apos;t load reviews right now.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="text-accent font-semibold bg-transparent border-none cursor-pointer p-0"
          >
            Try again
          </button>
        </p>
      ) : reviews.length === 0 ? (
        <p className="mb-6">
          No store reviews yet — be the first to leave one.
        </p>
      ) : (
        <ul className="flex flex-col gap-5 mb-10">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-line pb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Stars rating={r.rating} />
                <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {r.reviewerName}
                </span>
              </div>
              <p className="mb-2">{r.comment}</p>
              {r.media.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.media.map((m) =>
                    m.type === "video" ? (
                      <video
                        key={m.url}
                        src={m.url}
                        controls
                        className="w-24 h-24 object-cover"
                      />
                    ) : (
                      <Image
                        key={m.url}
                        src={m.url}
                        alt=""
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover"
                      />
                    ),
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={onSubmit} className="max-w-md">
          <p className="mb-3">
            Bought something from us? Leave a store review.
          </p>

          <label className="block text-xs font-bold tracking-widest uppercase text-foreground mb-1.5">
            Order Reference *
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="From your order confirmation"
            className="block w-full px-3 py-3 border border-line text-[13px] outline-none transition-colors mb-4"
            required
          />

          <label className="block text-xs font-bold tracking-widest uppercase text-foreground mb-1.5">
            Rating *
          </label>
          <div
            className="flex gap-1 mb-4"
            role="radiogroup"
            aria-label="Rating"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                className="cursor-pointer bg-transparent border-none p-0"
              >
                <Star
                  width={22}
                  height={22}
                  className={
                    i <= rating
                      ? "fill-accent stroke-accent"
                      : "fill-transparent stroke-muted"
                  }
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your review *"
            rows={5}
            className="block w-full px-3 py-3 border border-line text-[13px] resize-y outline-none transition-colors"
            aria-label="Your review"
            required
          />

          <label className="block text-xs font-bold tracking-widest uppercase text-foreground mt-4 mb-1.5">
            Photos / Video
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {media.map((m) => (
              <div key={m.url} className="relative w-20 h-20">
                {m.type === "video" ? (
                  <video src={m.url} className="w-20 h-20 object-cover" />
                ) : (
                  <Image
                    src={m.url}
                    alt=""
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(m.url)}
                  aria-label="Remove attachment"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-white flex items-center justify-center cursor-pointer border-none"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {media.length < MAX_FILES && (
              <label className="w-20 h-15 border border-dashed border-line flex items-center justify-center cursor-pointer text-secondary text-xs">
                {uploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "+ Add"
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    onFilesSelected(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || uploading}
            className="mt-3 bg-foreground text-white border-none px-7 py-2.5 text-xs font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Submitting…" : "Submit"}
          </button>
        </form>
      ) : (
        <p>
          <Link href="/login" className="text-accent font-semibold">
            Log in
          </Link>{" "}
          to leave a store review.
        </p>
      )}
    </div>
  );
}
