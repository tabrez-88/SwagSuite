import { Router } from "express";
import express from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { InvoiceController } from "../controllers/invoice.controller";

const router = Router();

// =====================================================
// QUICKBOOKS
// =====================================================

router.get("/api/integrations/quickbooks/auth", isAuthenticated, asyncHandler(InvoiceController.quickbooksAuth));
router.get("/api/integrations/quickbooks/callback", asyncHandler(InvoiceController.quickbooksCallback));
router.post("/api/orders/:id/quickbooks/sync", isAuthenticated, asyncHandler(InvoiceController.quickbooksSync));

// =====================================================
// INVOICE CRUD
// =====================================================

router.post("/api/orders/:id/invoice", isAuthenticated, asyncHandler(InvoiceController.createInvoice));
router.get("/api/orders/:id/invoice", isAuthenticated, asyncHandler(InvoiceController.getInvoice));
router.patch("/api/orders/:id/invoice", isAuthenticated, asyncHandler(InvoiceController.updateInvoice));

// =====================================================
// STRIPE PAYMENTS
// =====================================================

router.post("/api/invoices/:id/payment-link", isAuthenticated, asyncHandler(InvoiceController.createPaymentLink));
router.post("/api/invoices/:id/manual-payment", isAuthenticated, asyncHandler(InvoiceController.recordManualPayment));
router.post("/api/integrations/stripe/payment-intent", isAuthenticated, asyncHandler(InvoiceController.createPaymentIntent));

// Stripe webhook — uses express.raw middleware, NO authentication
router.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), asyncHandler(InvoiceController.stripeWebhook));

// =====================================================
// TAXJAR
// =====================================================

router.post("/api/integrations/taxjar/calculate", isAuthenticated, asyncHandler(InvoiceController.calculateTax));

export default router;
