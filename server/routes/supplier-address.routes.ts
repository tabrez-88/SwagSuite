import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { SupplierAddressController } from "../controllers/supplier-address.controller";

const router = Router();

router.get("/api/suppliers/:supplierId/addresses", isAuthenticated, asyncHandler(SupplierAddressController.list));
router.get("/api/suppliers/:supplierId/addresses/:addressId", isAuthenticated, asyncHandler(SupplierAddressController.getById));
router.post("/api/suppliers/:supplierId/addresses", isAuthenticated, asyncHandler(SupplierAddressController.create));
router.patch("/api/suppliers/:supplierId/addresses/:addressId", isAuthenticated, asyncHandler(SupplierAddressController.update));
router.delete("/api/suppliers/:supplierId/addresses/:addressId", isAuthenticated, asyncHandler(SupplierAddressController.delete));

export default router;
