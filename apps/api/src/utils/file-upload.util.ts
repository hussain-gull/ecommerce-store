import multer from "multer";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { createHttpError } from "./response.util.js";

// ── Upload limits ─────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a source photo, small next to Cloudinary's own caps
const MAX_DIMENSION_PX = 6000; // guards against decompression-bomb style images (huge pixel dims in a small file)
const OUTPUT_MAX_WIDTH_PX = 1920; // home page never needs a wider source image than this
const OUTPUT_WEBP_QUALITY = 82; // sweet spot: visually lossless, ~70-80% smaller than source

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ── Multer (multipart parsing) ───────────────────────────────────────────────
// Memory storage only — the raw upload never touches disk, so there's nothing
// on the filesystem for a malicious payload to land in before validation runs.
// The mimetype check here is a cheap first reject; it's client-supplied and
// spoofable, so it is NOT the security boundary — sharp's decode in
// compressImage() is, since it parses real image bytes rather than trusting a header.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        createHttpError(
          415,
          "Unsupported file type. Use JPEG, PNG, WEBP, or AVIF.",
        ),
      );
      return;
    }
    cb(null, true);
  },
});

// ── Video uploads (blog) ─────────────────────────────────────────────────────
// Videos can't be decoded/re-encoded here the way sharp handles images, so the
// real content check happens at Cloudinary: uploading with resource_type
// "video" rejects anything that isn't a decodable video.
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO_MIME_TYPES.has(file.mimetype)) {
      cb(createHttpError(415, "Unsupported file type. Use MP4, WEBM, or MOV."));
      return;
    }
    cb(null, true);
  },
});

// ── Real file-type check (magic bytes, not the client-supplied header) ──────
// Videos aren't decoded server-side the way sharp handles images, so without
// this a video buffer would reach Cloudinary with nothing but the spoofable
// multer mimetype checked. `file-type` sniffs the actual file signature —
// used here for videos, and as a cheap extra check for images before the
// (stronger) sharp decode in compressImage().
export async function assertRealFileType(
  buffer: Buffer,
  allowedMimeTypes: ReadonlySet<string>,
): Promise<void> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowedMimeTypes.has(detected.mime)) {
    throw createHttpError(422, "File content does not match an allowed type.");
  }
}

/**
 * Decodes, validates, and compresses an uploaded image buffer.
 * - Rejects anything sharp can't decode as a real image (catches mimetype spoofing).
 * - Rejects implausibly large pixel dimensions before any resize work happens.
 * - Auto-orients from EXIF then re-encodes to webp, which strips all other
 *   metadata (GPS/camera EXIF, XMP) by default — nothing is preserved unless
 *   `.withMetadata()` is called, which we deliberately don't.
 */
export async function compressImage(buffer: Buffer): Promise<Buffer> {
  await assertRealFileType(buffer, ALLOWED_MIME_TYPES);

  const image = sharp(buffer, { failOn: "error" });

  const metadata = await image.metadata().catch(() => {
    throw createHttpError(422, "File is not a valid image.");
  });

  if (!metadata.width || !metadata.height) {
    throw createHttpError(422, "File is not a valid image.");
  }
  if (metadata.width > MAX_DIMENSION_PX || metadata.height > MAX_DIMENSION_PX) {
    throw createHttpError(
      422,
      `Image dimensions must not exceed ${MAX_DIMENSION_PX}px.`,
    );
  }

  return image
    .rotate() // bake in EXIF orientation before it's stripped
    .resize({ width: OUTPUT_MAX_WIDTH_PX, withoutEnlargement: true })
    .webp({ quality: OUTPUT_WEBP_QUALITY })
    .toBuffer();
}
