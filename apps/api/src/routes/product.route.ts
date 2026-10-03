import { Router } from "express";
import {
  listProducts,
  queryProducts,
  getProductBySlug,
  suggestProducts,
} from "../controllers/product.controller.js";

export const productRouter = Router();

// Public — storefront reads. Only published products are ever returned.
productRouter.get("/", listProducts);
// Filtered/sorted/paged catalogue; the body carries the filters (HTTP QUERY).
productRouter.query!("/", queryProducts);
// Declared before /:slug so "suggest" isn't read as a slug.
productRouter.get("/suggest", suggestProducts);
productRouter.get("/:slug", getProductBySlug);
