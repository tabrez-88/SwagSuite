import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ApprovalController } from "../controllers/approval.controller";

const router = Router();

// =====================================================
// GROUP 1: ARTWORK APPROVALS
// =====================================================

// Public endpoints (no auth) — used by clients via approval links
router.get("/api/approvals/:token", asyncHandler(ApprovalController.getArtworkApproval));
router.post("/api/approvals/:token/approve", asyncHandler(ApprovalController.approveArtwork));
router.post("/api/approvals/:token/reject", asyncHandler(ApprovalController.rejectArtwork));

// Authenticated endpoints — used by internal users
router.post("/api/projects/:projectId/generate-approval", isAuthenticated, asyncHandler(ApprovalController.generateApproval));
router.get("/api/projects/:projectId/approvals", isAuthenticated, asyncHandler(ApprovalController.listOrderApprovals));

// =====================================================
// GROUP 2: CLIENT APPROVALS (quote/SO approval, public)
// =====================================================

// PDF proxy for inline viewing (public — used by approval pages)
router.get("/api/pdf-proxy", asyncHandler(ApprovalController.pdfProxy));

// Legacy redirect for old quote-approval endpoints
router.get("/api/quote-approvals/:token", (req, res) => res.redirect(307, `/api/client-approvals/${req.params.token}`));
router.post("/api/quote-approvals/:token/approve", (req, res) => res.redirect(307, `/api/client-approvals/${req.params.token}/approve`));
router.post("/api/quote-approvals/:token/decline", (req, res) => res.redirect(307, `/api/client-approvals/${req.params.token}/decline`));

// Public endpoints — client approval portal
router.get("/api/client-approvals/:token", asyncHandler(ApprovalController.getClientApproval));
router.post("/api/client-approvals/:token/approve", asyncHandler(ApprovalController.approveClientApproval));
router.post("/api/client-approvals/:token/decline", asyncHandler(ApprovalController.declineClientApproval));

// =====================================================
// GROUP 3: QUOTE APPROVALS (authenticated, project-scoped)
// =====================================================

router.post("/api/projects/:projectId/quote-approvals", isAuthenticated, asyncHandler(ApprovalController.createQuoteApproval));
router.get("/api/projects/:projectId/quote-approvals", isAuthenticated, asyncHandler(ApprovalController.listQuoteApprovals));
router.patch("/api/projects/:projectId/quote-approvals/:approvalId", isAuthenticated, asyncHandler(ApprovalController.updateQuoteApproval));

// =====================================================
// GROUP 4: PO CONFIRMATIONS
// =====================================================

router.post("/api/projects/:projectId/po-confirmations", isAuthenticated, asyncHandler(ApprovalController.createPoConfirmation));
router.get("/api/po-confirmations/:token", asyncHandler(ApprovalController.getPoConfirmation));
router.post("/api/po-confirmations/:token/confirm", asyncHandler(ApprovalController.confirmPo));
router.post("/api/po-confirmations/:token/decline", asyncHandler(ApprovalController.declinePo));

export default router;
