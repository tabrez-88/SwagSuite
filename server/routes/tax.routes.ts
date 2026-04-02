import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { TaxController } from "../controllers/tax.controller";

const router = Router();

router.get("/api/tax-codes", isAuthenticated, asyncHandler(TaxController.list));
router.post("/api/tax-codes", isAuthenticated, asyncHandler(TaxController.create));
router.patch("/api/tax-codes/:id", isAuthenticated, asyncHandler(TaxController.update));
router.delete("/api/tax-codes/:id", isAuthenticated, asyncHandler(TaxController.delete));

export default router;
