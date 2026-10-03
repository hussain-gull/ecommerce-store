import type { Response } from "express";
import type {
  ApiResponseBody,
  ApiErrorBody,
  ApiFieldError,
  PaginationMeta,
} from "@ecommerce/contracts";

export type HttpError = Error & { statusCode: number };

/** Creates a typed HTTP error for use in service-layer throws. */
export function createHttpError(
  statusCode: number,
  message: string,
): HttpError {
  return Object.assign(new Error(message), { statusCode });
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T[],
  paginationMeta: PaginationMeta | null = null,
): Response {
  const body: ApiResponseBody<T> = {
    success: true,
    statusCode,
    message,
    response: { data, paginationMeta },
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors: ApiFieldError[] = [],
): Response {
  const body: ApiErrorBody = { success: false, statusCode, message, errors };
  return res.status(statusCode).json(body);
}
