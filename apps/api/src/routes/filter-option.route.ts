import { Router } from "express";
import { listFilterOptions } from "../controllers/filter-option.controller.js";

export const filterOptionRouter = Router();

filterOptionRouter.get("/", listFilterOptions);
