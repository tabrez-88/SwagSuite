import { Router } from "express";
import { ShippingAccountController } from "../controllers/shipping-account.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// ── Shipping Accounts (authenticated) ──
router.get("/api/shipping-accounts", isAuthenticated, asyncHandler(ShippingAccountController.listOrg));
router.get("/api/shipping-accounts/company/:companyId", isAuthenticated, asyncHandler(ShippingAccountController.listByCompany));
router.post("/api/shipping-accounts", isAuthenticated, asyncHandler(ShippingAccountController.create));
router.put("/api/shipping-accounts/:id", isAuthenticated, asyncHandler(ShippingAccountController.update));
router.delete("/api/shipping-accounts/:id", isAuthenticated, asyncHandler(ShippingAccountController.delete));

export default router;
