import type { Request, Response, NextFunction } from "express";
import {
  adminProductsQuerySchema,
  createProductSchema,
  shopQuerySchema,
  suggestQuerySchema,
  updateProductSchema,
} from "@ecommerce/contracts";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  listPublishedProductsService,
  getPublishedProductBySlugService,
  adminProductCountsService,
  listAdminProductsService,
  getAdminProductService,
  createProductService,
  updateProductService,
  deleteProductService,
} from "../services/product.service.js";
import { suggestProductsService } from "../services/search.service.js";
import { queryProductsService } from "../services/shop-query.service.js";

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = req.query["category"];
    const products = await listPublishedProductsService(
      typeof category === "string" ? { category } : undefined,
    );
    sendSuccess(res, 200, "Products retrieved.", products);
  } catch (err) {
    next(err);
  }
}

// QUERY (safe, idempotent, body-carrying) — the filter set is too long for a URL.
export async function queryProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = shopQuerySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendError(res, 422, "Invalid shop query.", zodErrors(parsed.error));
    return;
  }
  try {
    sendSuccess(res, 200, "Products retrieved.", [
      await queryProductsService(parsed.data),
    ]);
  } catch (err) {
    next(err);
  }
}

// Typeahead for the storefront search box.
export async function suggestProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = suggestQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, 422, "Invalid search query.", zodErrors(parsed.error));
    return;
  }
  try {
    sendSuccess(
      res,
      200,
      "Suggestions retrieved.",
      await suggestProductsService(parsed.data.q),
    );
  } catch (err) {
    next(err);
  }
}

export async function getProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const slug = req.params["slug"] as string | undefined;
  if (!slug) {
    sendError(res, 400, "Product slug is required.");
    return;
  }
  try {
    const product = await getPublishedProductBySlugService(slug);
    sendSuccess(res, 200, "Product retrieved.", [product]);
  } catch (err) {
    next(err);
  }
}

export async function listAdminProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = adminProductsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, 422, "Invalid products query.", zodErrors(parsed.error));
    return;
  }
  try {
    const { products, meta } = await listAdminProductsService(parsed.data);
    sendSuccess(res, 200, "Products retrieved.", products, meta);
  } catch (err) {
    next(err);
  }
}

export async function adminProductCounts(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, 200, "Product counts.", [
      await adminProductCountsService(),
    ]);
  } catch (err) {
    next(err);
  }
}

export async function getAdminProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Product ID is required.");
    return;
  }
  try {
    const product = await getAdminProductService(id);
    sendSuccess(res, 200, "Product retrieved.", [product]);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const product = await createProductService(parsed.data);
    sendSuccess(res, 201, "Product created.", [product]);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Product ID is required.");
    return;
  }
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const product = await updateProductService(id, parsed.data);
    sendSuccess(res, 200, "Product updated.", [product]);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params["id"] as string | undefined;
  if (!id) {
    sendError(res, 400, "Product ID is required.");
    return;
  }
  try {
    await deleteProductService(id);
    sendSuccess(res, 200, "Product deleted.", []);
  } catch (err) {
    next(err);
  }
}
