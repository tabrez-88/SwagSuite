import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ProductionController } from "../controllers/production.controller";

const router = Router();

// Production orders
router.get("/api/production/orders", isAuthenticated, asyncHandler(ProductionController.listOrders));

// Production update on project
router.patch("/api/projects/:id/production", isAuthenticated, asyncHandler(ProductionController.updateProduction));

// Production stages CRUD
router.get("/api/production/stages", isAuthenticated, asyncHandler(ProductionController.listStages));
router.post("/api/production/stages/reorder", isAuthenticated, asyncHandler(ProductionController.reorderStages));
router.post("/api/production/stages/reset", isAuthenticated, asyncHandler(ProductionController.resetStages));
router.post("/api/production/stages", isAuthenticated, asyncHandler(ProductionController.createStage));
router.put("/api/production/stages/:id", isAuthenticated, asyncHandler(ProductionController.updateStage));
router.delete("/api/production/stages/:id", isAuthenticated, asyncHandler(ProductionController.deleteStage));

// Next action types CRUD
router.get("/api/production/next-action-types", isAuthenticated, asyncHandler(ProductionController.listNextActionTypes));
router.post("/api/production/next-action-types/reorder", isAuthenticated, asyncHandler(ProductionController.reorderNextActionTypes));
router.post("/api/production/next-action-types/reset", isAuthenticated, asyncHandler(ProductionController.resetNextActionTypes));
router.post("/api/production/next-action-types", isAuthenticated, asyncHandler(ProductionController.createNextActionType));
router.put("/api/production/next-action-types/:id", isAuthenticated, asyncHandler(ProductionController.updateNextActionType));
router.delete("/api/production/next-action-types/:id", isAuthenticated, asyncHandler(ProductionController.deleteNextActionType));

// Production alerts
router.get("/api/production/alerts", isAuthenticated, asyncHandler(ProductionController.getAlerts));

// PO report
router.get("/api/production/po-report", isAuthenticated, asyncHandler(ProductionController.getPoReport));
router.get("/api/production/po-report/:documentId", isAuthenticated, asyncHandler(ProductionController.getPoReportDetail));

export default router;
