import type { Request, Response, NextFunction } from "express";
import {
  createFilterOptionSchema,
  updateFilterOptionSchema,
} from "@ecommerce/contracts";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  filterOptionUsageService,
  listFilterOptionsService,
  createFilterOptionService,
  updateFilterOptionService,
  deleteFilterOptionService,
} from "../services/filter-option.service.js";

export async function listFilterOptions(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const options = await listFilterOptionsService();
    sendSuccess(res, 200, "Filter options retrieved.", options);
  } catch (err) {
    next(err);
  }
}

export async function createFilterOption(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = createFilterOptionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const option = await createFilterOptionService(parsed.data);
    sendSuccess(res, 201, "Filter option created.", [option]);
  } catch (err) {
    next(err);
  }
}

export async function updateFilterOption(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Filter option ID is required.");
    return;
  }
  const parsed = updateFilterOptionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const option = await updateFilterOptionService(id, parsed.data);
    sendSuccess(res, 200, "Filter option updated.", [option]);
  } catch (err) {
    next(err);
  }
}

export async function deleteFilterOption(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Filter option ID is required.");
    return;
  }
  try {
    await deleteFilterOptionService(id);
    sendSuccess(res, 200, "Filter option deleted.", []);
  } catch (err) {
    next(err);
  }
}

export async function filterOptionUsage(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, 200, "Filter option usage.", [
      await filterOptionUsageService(),
    ]);
  } catch (err) {
    next(err);
  }
}
