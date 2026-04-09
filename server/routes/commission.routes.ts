import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { CommissionController } from "../controllers/commission.controller";

const router = Router();

router.get("/api/reports/commissions", isAuthenticated, asyncHandler(CommissionController.getReport));
router.patch("/api/users/:id/commission", isAuthenticated, asyncHandler(CommissionController.setCommission));

export default router;
