import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { CompanyController } from "../controllers/company.controller";

const router = Router();

router.get("/api/companies/search", isAuthenticated, asyncHandler(CompanyController.search));
router.get("/api/companies", isAuthenticated, asyncHandler(CompanyController.list));
router.get("/api/companies/:id", isAuthenticated, asyncHandler(CompanyController.getById));
router.post("/api/companies", isAuthenticated, asyncHandler(CompanyController.create));
router.patch("/api/companies/:id", isAuthenticated, asyncHandler(CompanyController.update));
router.delete("/api/companies/:id", isAuthenticated, asyncHandler(CompanyController.delete));

export default router;
