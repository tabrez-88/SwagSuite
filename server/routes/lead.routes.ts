import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { LeadController } from "../controllers/lead.controller";

const router = Router();

router.get("/api/leads", isAuthenticated, asyncHandler(LeadController.list));
router.post("/api/leads", isAuthenticated, asyncHandler(LeadController.create));
router.patch("/api/leads/:id", isAuthenticated, asyncHandler(LeadController.update));
router.delete("/api/leads/:id", isAuthenticated, asyncHandler(LeadController.delete));
router.get("/api/reports/lead-sources", isAuthenticated, asyncHandler(LeadController.leadSourceReport));

export default router;
