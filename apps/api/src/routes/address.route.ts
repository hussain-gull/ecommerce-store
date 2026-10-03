import { Router } from "express";
import {
  listAddresses,
  createAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const addressRouter = Router();

// All address endpoints require a valid access token.
addressRouter.use(authenticate);

addressRouter.get("/", listAddresses);
addressRouter.post("/", createAddress);
addressRouter.delete("/:id", deleteAddress);
