import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { DashboardExtendedController } from "../controllers/dashboardExtended.controller";

const router = Router();

// Universal search
router.get("/api/search", isAuthenticated, asyncHandler(DashboardExtendedController.universalSearch));

// Enhanced dashboard stats
router.get("/api/dashboard/enhanced-stats", isAuthenticated, asyncHandler(DashboardExtendedController.getEnhancedStats));

// Manual YTD sync
router.post("/api/sync/ytd-spending", isAuthenticated, asyncHandler(DashboardExtendedController.syncYtdSpending));

// Team performance
router.get("/api/dashboard/team-performance", isAuthenticated, asyncHandler(DashboardExtendedController.getTeamPerformance));

// Popular & suggested products analytics (moved to product.routes.ts to avoid :id param capture)

// Admin suggested products management
router.post("/api/admin/suggested-products", isAuthenticated, asyncHandler(DashboardExtendedController.createAdminSuggestedProduct));
router.get("/api/admin/suggested-products", isAuthenticated, asyncHandler(DashboardExtendedController.getAdminSuggestedProducts));
router.put("/api/admin/suggested-products/:id", isAuthenticated, asyncHandler(DashboardExtendedController.updateAdminSuggestedProduct));
router.delete("/api/admin/suggested-products/:id", isAuthenticated, asyncHandler(DashboardExtendedController.deleteAdminSuggestedProduct));

// Dashboard automation & news
router.get("/api/dashboard/automation-tasks", isAuthenticated, asyncHandler(DashboardExtendedController.getAutomationTasks));
router.get("/api/dashboard/news-alerts", isAuthenticated, asyncHandler(DashboardExtendedController.getNewsAlerts));

// AI reports
router.get("/api/reports/suggestions", isAuthenticated, asyncHandler(DashboardExtendedController.getReportSuggestions));
router.post("/api/reports/generate", isAuthenticated, asyncHandler(DashboardExtendedController.generateReport));
// Stubs for templates & recent reports (client queries these; return empty arrays)
router.get("/api/reports/templates", isAuthenticated, (_req, res) => res.json([]));
router.get("/api/reports/recent", isAuthenticated, (_req, res) => res.json([]));

export default router;
