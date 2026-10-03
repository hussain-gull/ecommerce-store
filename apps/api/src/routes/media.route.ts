import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { imageUpload, videoUpload } from "../utils/file-upload.util.js";
import { createHttpError } from "../utils/response.util.js";
import {
  uploadMedia,
  uploadReviewMedia,
  uploadPaymentProof,
  deleteReviewMedia,
} from "../controllers/media.controller.js";
import {
  authenticateAdmin,
  authenticate,
} from "../middleware/auth.middleware.js";

import { uploadLimiter } from "../middleware/rate-limit.middleware.js";

export const mediaRouter = Router();

// Wraps multer so its errors (oversize file, rejected mimetype) surface with
// the right HTTP status through the app's normal error handler, instead of
// defaulting to 500.
function handleUpload(uploader: multer.Multer, maxLabel: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploader.single("file")(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        next(createHttpError(413, `File is too large. Max ${maxLabel}.`));
        return;
      }
      next(err);
    });
  };
}

mediaRouter.post(
  "/upload",
  authenticateAdmin,
  handleUpload(imageUpload, "8MB"),
  uploadMedia,
);
mediaRouter.post(
  "/upload-video",
  authenticateAdmin,
  handleUpload(videoUpload, "50MB"),
  uploadMedia,
);

// Customer-facing — any signed-in shopper can attach photos/video to a store
// review. Category is hardcoded server-side to "review" (see controller).
mediaRouter.post(
  "/review-upload",
  authenticate,
  uploadLimiter,
  handleUpload(imageUpload, "8MB"),
  uploadReviewMedia,
);
mediaRouter.post(
  "/review-upload-video",
  authenticate,
  uploadLimiter,
  handleUpload(videoUpload, "50MB"),
  uploadReviewMedia,
);
// Customer-facing — the JazzCash payment screenshot at checkout.
mediaRouter.post(
  "/payment-upload",
  authenticate,
  uploadLimiter,
  handleUpload(imageUpload, "8MB"),
  uploadPaymentProof,
);
mediaRouter.delete("/review-upload", authenticate, deleteReviewMedia);
