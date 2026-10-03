import type {
  HomeContent,
  AboutUsContent,
  ContactUsContent,
  BlogContent,
  ConditionGuideContent,
  PaymentContent,
} from "@ecommerce/contracts";
import { moveToRecycleBinByUrl } from "../utils/cloudinary.util.js";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { createHttpError } from "../utils/response.util.js";
import { cacheDel, cacheGet, cacheSet } from "../utils/redis.util.js";
import { config } from "../config.js";

// Page copy lives in the `site_content` table (one row per page) so admin edits
// survive redeploys and are shared by every API instance. The table is filled
// initially by `pnpm seed:content` (scripts/seed-content.ts); there are no
// on-disk defaults, so an unseeded database answers 404.
type ContentKey = "home" | "about" | "contact" | "blog" | "condition-guide";

const cacheKey = (key: string) => `content:${key}`;
const PAYMENT_CACHE_KEY = cacheKey("payment");

async function readContent<T>(key: ContentKey): Promise<T> {
  const cached = await cacheGet<T>(cacheKey(key));
  if (cached) return cached;
  const row = await db.orm.public.site_content.where({ key }).first();
  if (!row) {
    throw createHttpError(
      404,
      `Page content "${key}" is not set up. Run \`pnpm seed:content\`.`,
    );
  }
  await cacheSet(cacheKey(key), row.data, config.cacheLongTtlSeconds);
  return row.data as T;
}

// Atomic upsert — two admins saving at once can't race a check-then-insert.
async function writeContent<T>(key: ContentKey, data: T): Promise<T> {
  const updated_at = nowUtc() as any;
  await db.orm.public.site_content.upsert({
    create: { key, data: data as any, updated_at },
    update: { data: data as any, updated_at },
  });
  await cacheDel(cacheKey(key));
  return data;
}

export const getHomeContentService = () => readContent<HomeContent>("home");
export const updateHomeContentService = (content: HomeContent) =>
  writeContent("home", content);

export const getAboutContentService = () =>
  readContent<AboutUsContent>("about");
export const updateAboutContentService = (content: AboutUsContent) =>
  writeContent("about", content);

export const getContactContentService = () =>
  readContent<ContactUsContent>("contact");
export const updateContactContentService = (content: ContactUsContent) =>
  writeContent("contact", content);

export const getBlogContentService = () => readContent<BlogContent>("blog");
export const updateBlogContentService = (content: BlogContent) =>
  writeContent("blog", content);

export const getConditionGuideContentService = () =>
  readContent<ConditionGuideContent>("condition-guide");
export const updateConditionGuideContentService = (
  content: ConditionGuideContent,
) => writeContent("condition-guide", content);

const PAYMENT_ID = "default";

// Blank until an admin saves real details — callers treat an empty
// accountNumber as "payments not set up" (see placeOrderService).
export async function getPaymentContentService(): Promise<PaymentContent> {
  const cached = await cacheGet<PaymentContent>(PAYMENT_CACHE_KEY);
  if (cached) return cached;
  const row = await db.orm.public.payment_settings
    .where({ id: PAYMENT_ID })
    .first();
  const payment = {
    accountName: row?.account_name ?? "",
    accountNumber: row?.account_number ?? "",
    supportPhone: row?.support_phone ?? "",
    qrImage: row?.qr_image ?? "",
  };
  await cacheSet(PAYMENT_CACHE_KEY, payment, config.cacheLongTtlSeconds);
  return payment;
}

// Replacing the QR moves the old Cloudinary asset to the recycle bin (best-effort, fail-open).
export async function updatePaymentContentService(
  content: PaymentContent,
): Promise<PaymentContent> {
  const previous = await getPaymentContentService();
  const values = {
    account_name: content.accountName,
    account_number: content.accountNumber,
    support_phone: content.supportPhone,
    qr_image: content.qrImage,
    updated_at: nowUtc() as any,
  };
  await db.orm.public.payment_settings.upsert({
    create: { id: PAYMENT_ID, ...values },
    update: values,
  });
  await cacheDel(PAYMENT_CACHE_KEY);
  if (previous.qrImage && previous.qrImage !== content.qrImage) {
    await moveToRecycleBinByUrl(previous.qrImage, "image");
  }
  return content;
}
