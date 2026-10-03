import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  homeContentSchema,
  aboutUsContentSchema,
  contactUsContentSchema,
  blogContentSchema,
  conditionGuideContentSchema,
  paymentContentSchema,
} from "@ecommerce/contracts";
import {
  getHomeContentService,
  updateHomeContentService,
  getAboutContentService,
  updateAboutContentService,
  getContactContentService,
  updateContactContentService,
  getBlogContentService,
  updateBlogContentService,
  getConditionGuideContentService,
  updateConditionGuideContentService,
  getPaymentContentService,
  updatePaymentContentService,
} from "../services/content.service.js";

export async function getHomeContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const content = await getHomeContentService();
    sendSuccess(res, 200, "Home content retrieved.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function updateHomeContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = homeContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const content = await updateHomeContentService(parsed.data);
    sendSuccess(res, 200, "Home content updated.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function getAboutContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const content = await getAboutContentService();
    sendSuccess(res, 200, "About page content retrieved.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function updateAboutContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = aboutUsContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const content = await updateAboutContentService(parsed.data);
    sendSuccess(res, 200, "About page content updated.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function getContactContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const content = await getContactContentService();
    sendSuccess(res, 200, "Contact page content retrieved.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function updateContactContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = contactUsContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const content = await updateContactContentService(parsed.data);
    sendSuccess(res, 200, "Contact page content updated.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function getBlogContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const content = await getBlogContentService();
    sendSuccess(res, 200, "Blog content retrieved.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function updateBlogContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = blogContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const content = await updateBlogContentService(parsed.data);
    sendSuccess(res, 200, "Blog content updated.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function getConditionGuideContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const content = await getConditionGuideContentService();
    sendSuccess(res, 200, "Condition guide retrieved.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function updateConditionGuideContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = conditionGuideContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const content = await updateConditionGuideContentService(parsed.data);
    sendSuccess(res, 200, "Condition guide updated.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function getPaymentContent(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const content = await getPaymentContentService();
    sendSuccess(res, 200, "Payment details retrieved.", [content]);
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = paymentContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const content = await updatePaymentContentService(parsed.data);
    sendSuccess(res, 200, "Payment details updated.", [content]);
  } catch (err) {
    next(err);
  }
}
