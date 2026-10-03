import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  type ContactMessage,
  contactMessageSchema,
  contactMessagesQuerySchema,
} from "@ecommerce/contracts";
import {
  sendContactMessageService,
  contactMessageCountsService,
  listContactMessagesService,
  markContactMessageReadService,
} from "../services/contact.service.js";

export async function sendContactMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = contactMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    await sendContactMessageService(parsed.data);
    sendSuccess(res, 201, "Message sent successfully.", []);
  } catch (err) {
    next(err);
  }
}

export async function listContactMessages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = contactMessagesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, 422, "Invalid messages query.", zodErrors(parsed.error));
    return;
  }
  try {
    const { messages, meta } = await listContactMessagesService(parsed.data);
    sendSuccess(res, 200, "Messages fetched successfully.", messages, meta);
  } catch (err) {
    next(err);
  }
}

export async function contactMessageCounts(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, 200, "Message counts.", [
      await contactMessageCountsService(),
    ]);
  } catch (err) {
    next(err);
  }
}

export async function markContactMessageRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Message ID is required.");
    return;
  }

  try {
    const message: ContactMessage = await markContactMessageReadService(id);
    sendSuccess(res, 200, "Message marked as read.", [message]);
  } catch (err) {
    next(err);
  }
}
