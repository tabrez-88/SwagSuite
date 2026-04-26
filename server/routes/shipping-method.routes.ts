import { Router } from "express";
import { ShippingMethodController } from "../controllers/shipping-method.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// ── Shipping Methods (authenticated) ──
router.get("/api/shipping-methods", isAuthenticated, asyncHandler(ShippingMethodController.list));
router.post("/api/shipping-methods", isAuthenticated, asyncHandler(ShippingMethodController.create));
router.put("/api/shipping-methods/reorder", isAuthenticated, asyncHandler(ShippingMethodController.reorder));
router.put("/api/shipping-methods/:id", isAuthenticated, asyncHandler(ShippingMethodController.update));
router.delete("/api/shipping-methods/:id", isAuthenticated, asyncHandler(ShippingMethodController.delete));

export default router;
