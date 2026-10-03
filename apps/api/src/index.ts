import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.route.js";
import { adminAuthRouter } from "./routes/admin-auth.route.js";
import { addressRouter } from "./routes/address.route.js";
import { cartRouter } from "./routes/cart.route.js";
import { wishlistRouter } from "./routes/wishlist.route.js";
import { contactRouter } from "./routes/contact.route.js";
import { contentRouter } from "./routes/content.route.js";
import { mediaRouter } from "./routes/media.route.js";
import { ensureSearchIndexes } from "./services/search.service.js";
import { productRouter } from "./routes/product.route.js";
import { adminProductRouter } from "./routes/admin-product.route.js";
import { reviewRouter } from "./routes/review.route.js";
import { orderRouter } from "./routes/order.route.js";
import { filterOptionRouter } from "./routes/filter-option.route.js";
import { adminFilterOptionRouter } from "./routes/admin-filter-option.route.js";
import type { ApiFieldError } from "@ecommerce/contracts";
import helmet from "helmet";
import cron from "node-cron";
import { config } from "./config.js";
import { globalLimiter } from "./middleware/rate-limit.middleware.js";
import { sendError } from "./utils/response.util.js";
import { cleanupStaleReviewMediaUploadsService } from "./services/media.service.js";

const app: Express = express();
const PORT: string = String(process.env.PROCESS_PORT ?? 4000);

const corsOptions = {
  origin: config.corsOrigins,
  // cors's default list lacks QUERY, so the browser preflight would be rejected.
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "QUERY"],
  credentials: true, // required for Authorization header + refresh_token cookie
  optionsSuccessStatus: 200,
};

app.set("trust proxy", config.trustProxyHops);
// JSON API consumed cross-origin by the storefront/admin — allow cross-origin
// resource loading, keep helmet's other defaults (nosniff, HSTS, no x-powered-by…).
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(globalLimiter);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(cors(corsOptions));
// CSRF defence-in-depth on top of sameSite=strict: browsers always attach Origin
// to cross-site writes, so reject state-changing requests from unlisted origins.
// No Origin (curl, server-side fetch) passes — those can't ride a victim's cookies.
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (
    origin &&
    !["GET", "HEAD", "OPTIONS", "QUERY"].includes(req.method) &&
    !config.corsOrigins.includes(origin)
  ) {
    sendError(res, 403, "Origin not allowed.");
    return;
  }
  next();
});
// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin/auth", adminAuthRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/content", contentRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/admin/products", adminProductRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/filter-options", filterOptionRouter);
app.use("/api/v1/admin/filter-options", adminFilterOptionRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Global error handler — catches service-level errors forwarded via next(err)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode =
    err instanceof Error &&
    "statusCode" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;
  // Never leak internals on unexpected errors in production.
  const message =
    err instanceof Error &&
    (statusCode < 500 || process.env.NODE_ENV !== "production")
      ? err.message
      : "Internal server error.";
  if (statusCode >= 500) console.error(err);
  // Services may attach per-field errors (e.g. the sold-out product ids on a 409).
  const errors =
    err instanceof Error && "errors" in err && Array.isArray(err.errors)
      ? (err.errors as ApiFieldError[])
      : [];
  sendError(res, statusCode, message, errors);
});

ensureSearchIndexes().catch((err) =>
  console.error("Search index setup failed — suggestions will error:", err),
);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  // Order emails silently degrade to console logs without a real Resend key —
  // fine in dev, a customer-facing outage in production.
  if (process.env.NODE_ENV === "production") {
    const [a, b] = [
      process.env.JWT_SECRET ?? "",
      process.env.ADMIN_JWT_SECRET ?? "",
    ];
    if (a.length < 32 || b.length < 32 || a === b) {
      console.error(
        "FATAL: JWT_SECRET and ADMIN_JWT_SECRET must each be >=32 chars and different.",
      );
      process.exit(1);
    }
    if (config.corsOrigins.some((o) => o.includes("localhost"))) {
      console.warn(
        "WARNING: CORS_ORIGINS still allows localhost — set the real storefront/admin origins.",
      );
    }
    if (!config.resendEnabled) {
      console.warn(
        "WARNING: RESEND_API_KEY is not a valid key — customer emails (order received / accepted, password reset) will NOT be sent.",
      );
    }
    if (config.trustProxyHops === 0) {
      console.warn(
        "WARNING: TRUST_PROXY_HOPS=0 — if the API runs behind a reverse proxy/load balancer, set it, or rate limits will key on the proxy's IP.",
      );
    }
  }
});

// Recycles review media that was uploaded (to Cloudinary + review_media_uploads)
// but never attached to a review — e.g. the user closed the tab mid-form.
// Runs daily at 3am server time — low-traffic hour, and uploads only go
// stale after 24h anyway so there's no benefit to running more often.
// ponytail: in-process schedule, single instance only; move to a real
// cron/queue (e.g. a hosted scheduler hitting an internal endpoint) if this
// API ever runs multiple instances, so the job doesn't fire once per instance.
cron.schedule("0 3 * * *", () => {
  cleanupStaleReviewMediaUploadsService().catch((err) =>
    console.error("Stale review media cleanup failed:", err),
  );
});
