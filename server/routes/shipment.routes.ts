import { Router } from "express";
import { ShipmentController } from "../controllers/shipment.controller";
import { PortalController } from "../controllers/portal.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// ── Project Shipments (authenticated) ──
router.get("/api/projects/:projectId/shipments", isAuthenticated, asyncHandler(ShipmentController.list));
router.get("/api/projects/:projectId/shipments/:shipmentId", isAuthenticated, asyncHandler(ShipmentController.getById));
router.post("/api/projects/:projectId/shipments", isAuthenticated, asyncHandler(ShipmentController.create));
router.patch("/api/projects/:projectId/shipments/:shipmentId", isAuthenticated, asyncHandler(ShipmentController.update));
router.delete("/api/projects/:projectId/shipments/:shipmentId", isAuthenticated, asyncHandler(ShipmentController.delete));

// ── Customer Portal Tokens (authenticated) ──
router.get("/api/projects/:projectId/portal-tokens", isAuthenticated, asyncHandler(PortalController.listTokens));
router.post("/api/projects/:projectId/portal-tokens", isAuthenticated, asyncHandler(PortalController.createToken));
router.delete("/api/projects/:projectId/portal-tokens/:tokenId", isAuthenticated, asyncHandler(PortalController.deleteToken));

// ── Public Customer Portal (NO AUTH) ──
router.get("/api/portal/:token", asyncHandler(PortalController.getPortal));

export default router;
