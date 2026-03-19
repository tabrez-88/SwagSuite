import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { VendorApprovalController } from "../controllers/vendorApproval.controller";

const router = Router();

router.get("/api/vendor-approvals", isAuthenticated, asyncHandler(VendorApprovalController.list));
router.post("/api/vendor-approvals", isAuthenticated, asyncHandler(VendorApprovalController.create));
router.patch("/api/vendor-approvals/:id", isAuthenticated, asyncHandler(VendorApprovalController.update));
router.get("/api/vendor-approvals/check/:supplierId", isAuthenticated, asyncHandler(VendorApprovalController.check));

export default router;
