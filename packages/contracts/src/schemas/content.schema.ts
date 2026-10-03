import { z } from "zod";

// ── shared fragments ──────────────────────────────────────────────────────────

// ── field character limits ──────────────────────────────────────────────────
// Kept in sync with the admin dashboard's input maxLength + live counters, so
// content always fits the storefront layout it renders into.
export const HOME_CONTENT_LIMITS = {
  statValue: 10,
  statLabel: 30,
  heroEyebrow: 60,
  heroHeading: 60,
  heroBody: 240,
  heroCta: 30,
  heroBadge: 30,
  ticker: 300,
  sectionEyebrow: 60,
  sectionHeading: 60,
  categoryCode: 4,
  categoryLabel: 40,
  categoryTagline: 60,
  categoryDesc: 180,
  viewAllCta: 30,
  ctaBody: 200,
  ctaText: 40,
} as const;

const statSchema = z.object({
  value: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.statValue),
  label: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.statLabel),
});

// ── home page sections ───────────────────────────────────────────────────────

const heroSchema = z.object({
  eyebrow: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.heroEyebrow),
  heading: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.heroHeading),
  body: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.heroBody),
  primaryCta: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.heroCta),
  secondaryCta: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.heroCta),
  badge: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.heroBadge),
  stats: z.array(statSchema).min(1, "Add at least one stat"),
  imageUrl: z.string().url().optional(),
});

const categorySchema = z.object({
  code: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.categoryCode, "Keep it short, e.g. FG"),
  label: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.categoryLabel),
  tagline: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.categoryTagline),
  desc: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.categoryDesc),
  imageUrl: z.string().url().optional(),
});

const categorySectionSchema = z.object({
  eyebrow: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.sectionEyebrow),
  heading: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.sectionHeading),
  categories: z.array(categorySchema).min(1, "Add at least one category"),
});

const bestsellersSchema = z.object({
  eyebrow: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.sectionEyebrow),
  heading: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.sectionHeading),
  viewAllCta: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.viewAllCta),
});

const ctaSchema = z.object({
  eyebrow: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.sectionEyebrow),
  heading: z
    .string()
    .min(1, "Required")
    .max(HOME_CONTENT_LIMITS.sectionHeading),
  body: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.ctaBody),
  ctaText: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.ctaText),
});

export const homeContentSchema = z.object({
  hero: heroSchema,
  ticker: z.string().min(1, "Required").max(HOME_CONTENT_LIMITS.ticker),
  categorySection: categorySectionSchema,
  bestsellers: bestsellersSchema,
  stats: z.array(statSchema).min(1, "Add at least one stat"),
  cta: ctaSchema,
});

export type HomeContent = z.infer<typeof homeContentSchema>;
export type HomeContentStat = z.infer<typeof statSchema>;
export type HomeContentCategory = z.infer<typeof categorySchema>;

// ── about us page ────────────────────────────────────────────────────────────

export const ABOUT_CONTENT_LIMITS = {
  metaTitle: 120,
  metaDescription: 300,
  storyEyebrow: 60,
  storyHeading: 60,
  storyParagraph: 500,
  storyCta: 30,
  storyTagline: 120,
  sectionHeading: 60,
  iconTitle: 60,
  iconBody: 300,
  ctaBody: 300,
  ctaText: 30,
} as const;

const metaSchema = z.object({
  title: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.metaTitle),
  description: z
    .string()
    .min(1, "Required")
    .max(ABOUT_CONTENT_LIMITS.metaDescription),
});

const iconValueSchema = z.object({
  icon: z.string().min(1, "Required"),
  title: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.iconTitle),
  body: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.iconBody),
});

export const aboutUsContentSchema = z.object({
  meta: metaSchema,
  story: z.object({
    eyebrow: z
      .string()
      .min(1, "Required")
      .max(ABOUT_CONTENT_LIMITS.storyEyebrow),
    heading: z.tuple([
      z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.storyHeading),
      z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.storyHeading),
    ]),
    paragraphs: z
      .array(
        z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.storyParagraph),
      )
      .min(1),
    cta: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.storyCta),
    sinceYear: z.number().int(),
    tagline: z
      .string()
      .min(1, "Required")
      .max(ABOUT_CONTENT_LIMITS.storyTagline),
    imageUrl: z.string().url().optional(),
  }),
  stats: z.array(statSchema).min(1, "Add at least one stat"),
  valuesHeading: z
    .string()
    .min(1, "Required")
    .max(ABOUT_CONTENT_LIMITS.sectionHeading),
  values: z.array(iconValueSchema).min(1, "Add at least one value"),
  whyChoose: z.object({
    heading: z
      .string()
      .min(1, "Required")
      .max(ABOUT_CONTENT_LIMITS.sectionHeading),
    body: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.ctaBody),
    items: z.array(iconValueSchema).min(1, "Add at least one item"),
  }),
  cta: z.object({
    heading: z
      .string()
      .min(1, "Required")
      .max(ABOUT_CONTENT_LIMITS.sectionHeading),
    body: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.ctaBody),
    primaryCta: z.string().min(1, "Required").max(ABOUT_CONTENT_LIMITS.ctaText),
    secondaryCta: z
      .string()
      .min(1, "Required")
      .max(ABOUT_CONTENT_LIMITS.ctaText),
  }),
});

export type AboutUsContent = z.infer<typeof aboutUsContentSchema>;

// ── contact us page ──────────────────────────────────────────────────────────

export const CONTACT_CONTENT_LIMITS = {
  metaTitle: 120,
  metaDescription: 300,
  heading: 60,
  getInTouchHeading: 60,
  getInTouchBody: 300,
  formHeading: 60,
  infoLabel: 40,
  infoLine: 80,
} as const;

export const contactUsContentSchema = z.object({
  meta: metaSchema,
  heading: z.string().min(1, "Required").max(CONTACT_CONTENT_LIMITS.heading),
  getInTouch: z.object({
    heading: z
      .string()
      .min(1, "Required")
      .max(CONTACT_CONTENT_LIMITS.getInTouchHeading),
    body: z
      .string()
      .min(1, "Required")
      .max(CONTACT_CONTENT_LIMITS.getInTouchBody),
  }),
  formHeading: z
    .string()
    .min(1, "Required")
    .max(CONTACT_CONTENT_LIMITS.formHeading),
  info: z
    .array(
      z.object({
        icon: z.string().min(1, "Required"),
        label: z
          .string()
          .min(1, "Required")
          .max(CONTACT_CONTENT_LIMITS.infoLabel),
        lines: z
          .array(
            z.string().min(1, "Required").max(CONTACT_CONTENT_LIMITS.infoLine),
          )
          .min(1),
      }),
    )
    .min(1, "Add at least one contact method"),
});

export type ContactUsContent = z.infer<typeof contactUsContentSchema>;

// ── blog page ────────────────────────────────────────────────────────────────

export const BLOG_CONTENT_LIMITS = {
  metaTitle: 120,
  metaDescription: 300,
  eyebrow: 60,
  heading: 60,
  intro: 300,
  slug: 80,
  postTitle: 100,
  postCategory: 30,
  postExcerpt: 240,
  postAuthor: 60,
  postParagraph: 2000,
  postMedia: 10,
} as const;

export const BLOG_MEDIA_TYPES = ["image", "video"] as const;

const blogMediaSchema = z.object({
  type: z.enum(BLOG_MEDIA_TYPES),
  url: z.string().url(),
});

const blogPostSchema = z.object({
  slug: z
    .string()
    .min(1, "Required")
    .max(BLOG_CONTENT_LIMITS.slug)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers and dashes only",
    ),
  title: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.postTitle),
  category: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.postCategory),
  author: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.postAuthor),
  publishedAt: z.iso.date(),
  excerpt: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.postExcerpt),
  body: z
    .array(z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.postParagraph))
    .min(1, "Add at least one paragraph"),
  // First item is the post's cover on the blog index.
  media: z
    .array(blogMediaSchema)
    .max(
      BLOG_CONTENT_LIMITS.postMedia,
      `Max ${BLOG_CONTENT_LIMITS.postMedia} files`,
    ),
});

export const blogContentSchema = z.object({
  meta: metaSchema,
  eyebrow: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.eyebrow),
  heading: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.heading),
  intro: z.string().min(1, "Required").max(BLOG_CONTENT_LIMITS.intro),
  posts: z
    .array(blogPostSchema)
    .refine(
      (posts) => new Set(posts.map((p) => p.slug)).size === posts.length,
      "Post slugs must be unique",
    ),
});

export type BlogContent = z.infer<typeof blogContentSchema>;
export type BlogContentPost = z.infer<typeof blogPostSchema>;
export type BlogMedia = z.infer<typeof blogMediaSchema>;

// ── product condition guide (shown at the bottom of product-info.tsx) ─────────

export const CONDITION_GUIDE_LIMITS = {
  label: 30,
  description: 200,
} as const;

const conditionGuideItemSchema = z.object({
  label: z.string().min(1, "Required").max(CONDITION_GUIDE_LIMITS.label),
  description: z
    .string()
    .min(1, "Required")
    .max(CONDITION_GUIDE_LIMITS.description),
});

export const conditionGuideContentSchema = z.object({
  items: z.array(conditionGuideItemSchema).min(1, "Add at least one condition"),
});

export type ConditionGuideContent = z.infer<typeof conditionGuideContentSchema>;
export type ConditionGuideItem = z.infer<typeof conditionGuideItemSchema>;

// ── payment details (JazzCash) ───────────────────────────────────────────────

export const PAYMENT_CONTENT_LIMITS = {
  accountName: 80,
  accountNumber: 40,
  supportPhone: 30,
} as const;

// Shown on the storefront checkout and in order emails. qrImage is a Cloudinary
// URL (category "payment-qr") or empty when no QR has been uploaded yet.
export const paymentContentSchema = z.object({
  accountName: z
    .string()
    .min(1, "Required")
    .max(PAYMENT_CONTENT_LIMITS.accountName),
  accountNumber: z
    .string()
    .min(1, "Required")
    .max(PAYMENT_CONTENT_LIMITS.accountNumber),
  supportPhone: z
    .string()
    .min(1, "Required")
    .max(PAYMENT_CONTENT_LIMITS.supportPhone),
  qrImage: z.union([z.string().url(), z.literal("")]),
});

export type PaymentContent = z.infer<typeof paymentContentSchema>;
