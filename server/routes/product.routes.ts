import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ProductController } from "../controllers/product.controller";
import { DashboardExtendedController } from "../controllers/dashboardExtended.controller";

const router = Router();

router.get("/api/products/search", isAuthenticated, asyncHandler(ProductController.search));
router.post("/api/products/sync-from-supplier", isAuthenticated, asyncHandler(ProductController.syncFromSupplier));
// Analytics routes must be before :id to avoid param capture
router.get("/api/products/popular", isAuthenticated, asyncHandler(DashboardExtendedController.getPopularProducts));
router.get("/api/products/suggested", isAuthenticated, asyncHandler(DashboardExtendedController.getSuggestedProducts));
router.get("/api/products", isAuthenticated, asyncHandler(ProductController.list));
router.post("/api/products", isAuthenticated, asyncHandler(ProductController.create));
router.get("/api/products/:id", isAuthenticated, asyncHandler(ProductController.getById));
router.patch("/api/products/:id", isAuthenticated, asyncHandler(ProductController.update));
router.delete("/api/products/:id", isAuthenticated, asyncHandler(ProductController.delete));
router.get("/api/products/:id/orders", isAuthenticated, asyncHandler(ProductController.getOrdersByProduct));

export default router;
