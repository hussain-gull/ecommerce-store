import { Router } from "express";
import {
  adminProductCounts,
  listAdminProducts,
  getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

export const adminProductRouter = Router();

// Every admin product endpoint requires an admin session — the catalogue is
// admin-panel-write-only, so there's no anonymous/customer path here.
adminProductRouter.use(authenticateAdmin);

adminProductRouter.get("/", listAdminProducts);
// Registered before "/:id" so "counts" isn't read as an id.
adminProductRouter.get("/counts", adminProductCounts);
adminProductRouter.get("/:id", getAdminProduct);
adminProductRouter.post("/", createProduct);
adminProductRouter.patch("/:id", updateProduct);
adminProductRouter.delete("/:id", deleteProduct);
