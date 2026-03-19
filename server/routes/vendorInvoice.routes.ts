import { Router } from "express";
import { VendorInvoiceController } from "../controllers/vendorInvoice.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// List vendor invoices (bills) for an order
router.get("/api/orders/:orderId/vendor-invoices", isAuthenticated, asyncHandler(VendorInvoiceController.list));

// Create vendor invoice (bill) for an order — with optional PO auto-vouch
router.post("/api/orders/:orderId/vendor-invoices", isAuthenticated, asyncHandler(VendorInvoiceController.create));

export default router;
