import { Router } from "express";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// ── Authenticated PO routes ──
router.get("/api/orders/:orderId/purchase-orders", isAuthenticated, asyncHandler(PurchaseOrderController.listByOrder));
router.post("/api/orders/:orderId/purchase-orders", isAuthenticated, asyncHandler(PurchaseOrderController.create));
router.put("/api/purchase-orders/:id/advance-stage", isAuthenticated, asyncHandler(PurchaseOrderController.advanceStage));
router.post("/api/purchase-orders/:id/regenerate", isAuthenticated, asyncHandler(PurchaseOrderController.regenerate));
router.post("/api/purchase-orders/:id/send-confirmation", isAuthenticated, asyncHandler(PurchaseOrderController.sendConfirmation));
router.put("/api/purchase-orders/:id", isAuthenticated, asyncHandler(PurchaseOrderController.update));
router.delete("/api/purchase-orders/:id", isAuthenticated, asyncHandler(PurchaseOrderController.delete));

// ── Vendor Portal (public, no auth) ──
router.get("/api/vendor-portal/po/:token", asyncHandler(PurchaseOrderController.getByToken));
router.post("/api/vendor-portal/po/:token/confirm", asyncHandler(PurchaseOrderController.confirmByToken));
router.post("/api/vendor-portal/po/:token/request-changes", asyncHandler(PurchaseOrderController.requestChangesByToken));

export default router;
