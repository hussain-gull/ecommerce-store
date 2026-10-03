import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { config } from "../config.js";
import type { MediaCategory } from "@ecommerce/contracts";

// ── Client singleton ─────────────────────────────────────────────────────────
// Configured lazily on first use so the server still boots without Cloudinary
// env vars set (mirrors the Resend client pattern in email.util.ts).

let configured = false;

function getCloudinary(): typeof cloudinary {
  if (!configured) {
    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

// ── Folder categorization ────────────────────────────────────────────────────
// One sub-folder per content category, e.g. "store/home-hero". Categories are
// a closed enum (see media.schema.ts), so this never receives caller-controlled
// path segments — that's what rules out folder-path/Cloudinary-injection.
export function buildFolder(category: MediaCategory): string {
  return `${config.cloudinaryRootFolder}/${category}`;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Uploads an already-validated media buffer (compressed image, or raw video)
 * to Cloudinary.
 * Streams the buffer in (no temp file on disk). Filenames are Cloudinary-
 * generated (unique_filename) — the caller's original filename is never
 * trusted as a public_id or path component.
 */
export function uploadImageBuffer(
  buffer: Buffer,
  category: MediaCategory,
  resourceType: "image" | "video" = "image",
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        folder: buildFolder(category),
        resource_type: resourceType,
        unique_filename: true,
        use_filename: false,
        overwrite: false,
      },
      (err, result?: UploadApiResponse) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

// Uploads never apply transformations, so the public_id is just the path
// segment between "/upload/v<version>/" and the file extension — including
// the folder (buildFolder prefixes it), e.g. "store/product/abc123".
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  return match?.[1] ?? null;
}

// ── Recycle bin ──────────────────────────────────────────────────────────────
// Assets are never destroyed. "Deleting" one moves it to
// "<root>/recycle-bin/<original path>" so it can be inspected or restored
// (rename it back) and a wrong delete is never permanent. The original folder
// structure is kept under the bin, e.g. "store/product/abc" →
// "store/recycle-bin/product/abc".
const RECYCLE_FOLDER = "recycle-bin";

export function recycleBinPublicId(publicId: string): string {
  const root = config.cloudinaryRootFolder;
  const bin = `${root}/${RECYCLE_FOLDER}/`;
  // Already binned → keep as is, so a repeat call can never nest bin/bin/….
  if (publicId.startsWith(bin)) return publicId;
  const relative = publicId.startsWith(`${root}/`)
    ? publicId.slice(root.length + 1)
    : publicId;
  return `${bin}${relative}`;
}

// Best-effort: a failed move must never block the DB write that triggered it
// (product delete/update) — same fail-open convention as the Redis cache.
// overwrite:false so a bin entry with the same id is never clobbered;
// invalidate:true so the old CDN URL stops resolving.
export async function moveToRecycleBin(
  publicId: string,
  resourceType: "image" | "video" = "image",
): Promise<void> {
  const target = recycleBinPublicId(publicId);
  if (target === publicId) return;
  try {
    await getCloudinary().uploader.rename(publicId, target, {
      resource_type: resourceType,
      overwrite: false,
      invalidate: true,
    });
  } catch (err) {
    console.error(`Cloudinary recycle failed for ${publicId}:`, err);
  }
}

export async function moveToRecycleBinByUrl(
  url: string,
  resourceType: "image" | "video" = "image",
): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (publicId) await moveToRecycleBin(publicId, resourceType);
}
