import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
  listAddressesService,
  createAddressService,
  deleteAddressService,
} from "../services/address.service.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import { createAddressSchema } from "@ecommerce/contracts";

export async function listAddresses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const addresses = await listAddressesService(userId);
    sendSuccess(res, 200, "Addresses retrieved.", addresses);
  } catch (err) {
    next(err);
  }
}

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }

  try {
    const userId = req.user!.sub;
    const address = await createAddressService(userId, parsed.data);
    sendSuccess(res, 201, "Address saved.", [address]);
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Address ID is required.");
    return;
  }

  try {
    const userId = req.user!.sub;
    await deleteAddressService(userId, id);
    sendSuccess(res, 200, "Address deleted.", []);
  } catch (err) {
    next(err);
  }
}
