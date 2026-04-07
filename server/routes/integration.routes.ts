import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { IntegrationController } from "../controllers/integration.controller";

const router = Router();

// ==================== HubSpot ====================
router.get("/api/integrations/hubspot/status", isAuthenticated, asyncHandler(IntegrationController.getHubspotStatus));
router.get("/api/integrations/hubspot/metrics", isAuthenticated, asyncHandler(IntegrationController.getHubspotMetrics));
router.post("/api/integrations/hubspot/sync", isAuthenticated, asyncHandler(IntegrationController.syncHubspot));

// ==================== Slack Bridge (SlackSidebar + SlackPanel) ====================
router.get("/api/slack/sync-messages", isAuthenticated, asyncHandler(IntegrationController.syncSlackMessages));
router.post("/api/slack/send-message", isAuthenticated, asyncHandler(IntegrationController.sendSlackBridgeMessage));
router.get("/api/slack/thread/:threadTs", isAuthenticated, asyncHandler(IntegrationController.getSlackThread));

// ==================== Slack Configuration ====================
router.post("/api/integrations/slack/config", isAuthenticated, asyncHandler(IntegrationController.saveSlackConfig));
router.post("/api/integrations/slack/test", isAuthenticated, asyncHandler(IntegrationController.testSlackConnection));
router.post("/api/integrations/slack/message", isAuthenticated, asyncHandler(IntegrationController.sendSlackIntegrationMessage));
router.get("/api/integrations/slack/channels", isAuthenticated, asyncHandler(IntegrationController.getSlackChannels));
router.get("/api/integrations/slack/messages", isAuthenticated, asyncHandler(IntegrationController.getSlackMessages));

// ==================== News ====================
router.get("/api/integrations/news/items", isAuthenticated, asyncHandler(IntegrationController.getNewsItems));

// ==================== SAGE (via /api/integrations/sage/*) ====================
router.get("/api/integrations/sage/products", isAuthenticated, asyncHandler(IntegrationController.getSageProducts));
router.post("/api/integrations/sage/test", isAuthenticated, asyncHandler(IntegrationController.testSageConnection));
router.post("/api/integrations/sage/search", isAuthenticated, asyncHandler(IntegrationController.searchSageProducts));
router.post("/api/integrations/sage/products/sync", isAuthenticated, asyncHandler(IntegrationController.syncSageProducts));

// ==================== SAGE (via /api/sage/*) ====================
router.get("/api/sage/products", isAuthenticated, asyncHandler(IntegrationController.getSageProductsList));
router.get("/api/sage/products/:id", isAuthenticated, asyncHandler(IntegrationController.getSageProductById));

// SAGE product pricing detail (105 API)
router.get("/api/sage/product-pricing/:prodEId", isAuthenticated, asyncHandler(IntegrationController.getSageProductPricing));

// ==================== Unified Product Search ====================
router.get("/api/integrations/products/search", isAuthenticated, asyncHandler(IntegrationController.searchUnifiedProducts));

// ==================== Credentials & Configuration ====================
// NOTE: There are two GET /api/integrations/credentials endpoints in routes.ts.
// The first (line ~4449) returns a subset with masked secrets for the integration settings page.
// The second (line ~6930) returns ALL credentials including QB/Stripe/TaxJar for the full settings page.
// We register the first one here; the second is registered below as getFullCredentials.
router.get("/api/integrations/credentials", isAuthenticated, asyncHandler(IntegrationController.getFullCredentials));
router.post("/api/integrations/credentials", isAuthenticated, asyncHandler(IntegrationController.saveCredentials));

// ==================== Configurations ====================
router.get("/api/integrations/configurations", isAuthenticated, asyncHandler(IntegrationController.getConfigurations));
router.patch("/api/integrations/configurations/:id", isAuthenticated, asyncHandler(IntegrationController.updateConfiguration));

// ==================== Generic Integration Test ====================
// IMPORTANT: This must come AFTER specific /api/integrations/sage/* routes to avoid matching :integration param
router.post("/api/integrations/:integration/test", isAuthenticated, asyncHandler(IntegrationController.testIntegration));

// ==================== S&S Activewear ====================
router.get("/api/ss-activewear/products", isAuthenticated, asyncHandler(IntegrationController.getSsActivewearProducts));
router.post("/api/ss-activewear/test-connection", isAuthenticated, asyncHandler(IntegrationController.testSsActivewearConnection));
router.get("/api/ss-activewear/product/:sku", isAuthenticated, asyncHandler(IntegrationController.getSsActivewearProductBySku));
router.get("/api/ss-activewear/brands", isAuthenticated, asyncHandler(IntegrationController.getSsActivewearBrands));
router.get("/api/ss-activewear/search", isAuthenticated, asyncHandler(IntegrationController.searchSsActivewearProducts));
router.post("/api/ss-activewear/products/sync", isAuthenticated, asyncHandler(IntegrationController.syncSsActivewearProducts));

// ==================== SanMar ====================
router.post("/api/sanmar/test-connection", isAuthenticated, asyncHandler(IntegrationController.testSanmarConnection));
router.get("/api/sanmar/search", isAuthenticated, asyncHandler(IntegrationController.searchSanmarProducts));
router.get("/api/sanmar/product/:styleId", isAuthenticated, asyncHandler(IntegrationController.getSanmarProductDetails));
router.post("/api/sanmar/products/sync", isAuthenticated, asyncHandler(IntegrationController.syncSanmarProducts));

// ==================== ShipStation ====================
router.post("/api/shipstation/test-connection", isAuthenticated, asyncHandler(IntegrationController.testShipStationConnection));
router.get("/api/shipstation/carriers", isAuthenticated, asyncHandler(IntegrationController.getShipStationCarriers));
router.get("/api/shipstation/shipments", isAuthenticated, asyncHandler(IntegrationController.getShipStationShipments));
router.post("/api/shipstation/shipments/sync", isAuthenticated, asyncHandler(IntegrationController.syncShipStationShipments));
router.post("/api/shipstation/orders/:orderId/push", isAuthenticated, asyncHandler(IntegrationController.pushOrderToShipStation));
// Webhook endpoint (unauthenticated - ShipStation sends webhooks without auth)
router.post("/api/shipstation/webhook", asyncHandler(IntegrationController.handleShipStationWebhook));

export default router;
