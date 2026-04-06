import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { PaymentTermsController } from "../controllers/paymentTerms.controller";

const router = Router();

router.get("/api/payment-terms", isAuthenticated, asyncHandler(PaymentTermsController.list));
router.post("/api/payment-terms", isAuthenticated, asyncHandler(PaymentTermsController.create));
router.patch("/api/payment-terms/:id", isAuthenticated, asyncHandler(PaymentTermsController.update));
router.post("/api/payment-terms/:id/set-default", isAuthenticated, asyncHandler(PaymentTermsController.setDefault));
router.delete("/api/payment-terms/:id", isAuthenticated, asyncHandler(PaymentTermsController.delete));

export default router;
