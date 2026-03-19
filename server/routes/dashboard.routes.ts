import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { DashboardController } from "../controllers/dashboard.controller";
import { SearchController } from "../controllers/search.controller";

const router = Router();

// Health & Utility
router.get("/api/health", asyncHandler(DashboardController.healthCheck));
router.get("/api/image-proxy", isAuthenticated, asyncHandler(DashboardController.imageProxy));

// Dashboard
router.get("/api/dashboard/stats", isAuthenticated, asyncHandler(DashboardController.getStats));
router.get("/api/dashboard/recent-orders", isAuthenticated, asyncHandler(DashboardController.getRecentOrders));
router.get("/api/dashboard/team-leaderboard", isAuthenticated, asyncHandler(DashboardController.getTeamLeaderboard));

// Search
router.post("/api/search/ai", isAuthenticated, asyncHandler(SearchController.aiSearch));

export default router;
