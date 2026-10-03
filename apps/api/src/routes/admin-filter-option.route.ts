import { Router } from "express";
import {
  filterOptionUsage,
  listFilterOptions,
  createFilterOption,
  updateFilterOption,
  deleteFilterOption,
} from "../controllers/filter-option.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

export const adminFilterOptionRouter = Router();

adminFilterOptionRouter.use(authenticateAdmin);

adminFilterOptionRouter.get("/", listFilterOptions);
// Registered before "/:id" routes so "usage" isn't read as an id.
adminFilterOptionRouter.get("/usage", filterOptionUsage);
adminFilterOptionRouter.post("/", createFilterOption);
adminFilterOptionRouter.patch("/:id", updateFilterOption);
adminFilterOptionRouter.delete("/:id", deleteFilterOption);
