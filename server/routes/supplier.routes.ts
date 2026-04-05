import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { SupplierController } from "../controllers/supplier.controller";

const router = Router();

router.get("/api/suppliers", isAuthenticated, asyncHandler(SupplierController.list));
router.get("/api/suppliers/:id", isAuthenticated, asyncHandler(SupplierController.getById));
router.post("/api/suppliers", isAuthenticated, asyncHandler(SupplierController.create));
router.patch("/api/suppliers/:id", isAuthenticated, asyncHandler(SupplierController.update));
router.delete("/api/suppliers/:id", isAuthenticated, asyncHandler(SupplierController.delete));

export default router;
