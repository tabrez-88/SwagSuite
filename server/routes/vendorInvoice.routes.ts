import { Router } from "express";
import { VendorInvoiceController } from "../controllers/vendorInvoice.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// List vendor invoices (bills) for a project
router.get("/api/projects/:projectId/vendor-invoices", isAuthenticated, asyncHandler(VendorInvoiceController.list));

// Create vendor invoice (bill) for a project — with optional PO auto-vouch
router.post("/api/projects/:projectId/vendor-invoices", isAuthenticated, asyncHandler(VendorInvoiceController.create));

export default router;
