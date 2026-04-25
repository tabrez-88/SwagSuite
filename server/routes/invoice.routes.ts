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
router.post("/api/projects/:id/quickbooks/sync", isAuthenticated, asyncHandler(InvoiceController.quickbooksSync));

// =====================================================
// INVOICE CRUD
// =====================================================

router.post("/api/projects/:id/invoice", isAuthenticated, asyncHandler(InvoiceController.createInvoice));
router.get("/api/projects/:id/invoice", isAuthenticated, asyncHandler(InvoiceController.getInvoice));
router.get("/api/projects/:id/invoices", isAuthenticated, asyncHandler(InvoiceController.getInvoices));
router.patch("/api/projects/:id/invoice", isAuthenticated, asyncHandler(InvoiceController.updateInvoice));
router.post("/api/projects/:id/deposit-invoice", isAuthenticated, asyncHandler(InvoiceController.createDepositInvoice));
router.post("/api/projects/:id/final-invoice", isAuthenticated, asyncHandler(InvoiceController.createFinalInvoice));

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

// =====================================================
// REPORTS
// =====================================================

router.get("/api/reports/accounts-receivable", isAuthenticated, asyncHandler(InvoiceController.getArAgingReport));

export default router;
