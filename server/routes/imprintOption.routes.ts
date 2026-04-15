import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { isAdmin } from "../config/adminAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { ImprintOptionController } from "../controllers/imprintOption.controller";

const router = Router();

// Public-to-auth: any authenticated user can read options for dropdowns.
router.get("/api/imprint-options", isAuthenticated, asyncHandler(ImprintOptionController.list));

// Admin only: manage options.
router.post("/api/imprint-options", isAuthenticated, isAdmin, asyncHandler(ImprintOptionController.create));
router.patch(
  "/api/imprint-options/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(ImprintOptionController.update),
);
router.delete(
  "/api/imprint-options/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(ImprintOptionController.delete),
);

// Suggestions — any authenticated user can submit one.
router.post(
  "/api/imprint-option-suggestions",
  isAuthenticated,
  asyncHandler(ImprintOptionController.createSuggestion),
);
// Admin only: review queue.
router.get(
  "/api/imprint-option-suggestions",
  isAuthenticated,
  isAdmin,
  asyncHandler(ImprintOptionController.listSuggestions),
);
router.get(
  "/api/imprint-option-suggestions/pending-count",
  isAuthenticated,
  isAdmin,
  asyncHandler(ImprintOptionController.pendingCount),
);
router.post(
  "/api/imprint-option-suggestions/:id/approve",
  isAuthenticated,
  isAdmin,
  asyncHandler(ImprintOptionController.approveSuggestion),
);
router.post(
  "/api/imprint-option-suggestions/:id/reject",
  isAuthenticated,
  isAdmin,
  asyncHandler(ImprintOptionController.rejectSuggestion),
);

export default router;
