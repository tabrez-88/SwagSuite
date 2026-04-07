import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ProductController } from "../controllers/product.controller";

const router = Router();

router.get("/api/products/search", isAuthenticated, asyncHandler(ProductController.search));
router.post("/api/products/sync-from-supplier", isAuthenticated, asyncHandler(ProductController.syncFromSupplier));
router.get("/api/products", isAuthenticated, asyncHandler(ProductController.list));
router.post("/api/products", isAuthenticated, asyncHandler(ProductController.create));
router.get("/api/products/:id", isAuthenticated, asyncHandler(ProductController.getById));
router.patch("/api/products/:id", isAuthenticated, asyncHandler(ProductController.update));
router.delete("/api/products/:id", isAuthenticated, asyncHandler(ProductController.delete));
router.get("/api/products/:id/orders", isAuthenticated, asyncHandler(ProductController.getOrdersByProduct));

export default router;
