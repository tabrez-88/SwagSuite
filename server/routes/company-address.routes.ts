import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { CompanyAddressController } from "../controllers/company-address.controller";

const router = Router();

router.get("/api/companies/:companyId/addresses", isAuthenticated, asyncHandler(CompanyAddressController.list));
router.get("/api/companies/:companyId/addresses/:addressId", isAuthenticated, asyncHandler(CompanyAddressController.getById));
router.post("/api/companies/:companyId/addresses", isAuthenticated, asyncHandler(CompanyAddressController.create));
router.patch("/api/companies/:companyId/addresses/:addressId", isAuthenticated, asyncHandler(CompanyAddressController.update));
router.delete("/api/companies/:companyId/addresses/:addressId", isAuthenticated, asyncHandler(CompanyAddressController.delete));

export default router;
