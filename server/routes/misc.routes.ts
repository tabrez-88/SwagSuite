import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { upload, presentationUpload } from "../config/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";
import {
  MockupBuilderController,
  PresentationController,
  ProductCommentController,
  PresentationShareController,
  CloudinaryUploadController,
  SeedController,
} from "../controllers/misc.controller";

const router = Router();

// ── Mockup Builder ──
router.get("/api/mockup-builder/products/search", isAuthenticated, asyncHandler(MockupBuilderController.searchProducts));
router.get("/api/mockup-builder/templates", isAuthenticated, asyncHandler(MockupBuilderController.getTemplates));
router.post("/api/mockup-builder/templates", isAuthenticated, asyncHandler(MockupBuilderController.createTemplate));
router.post("/api/mockup-builder/generate-ai-templates", isAuthenticated, asyncHandler(MockupBuilderController.generateAiTemplates));
router.post("/api/mockup-builder/mockups/download", isAuthenticated, asyncHandler(MockupBuilderController.downloadMockup));
router.post("/api/mockup-builder/mockups/email", isAuthenticated, asyncHandler(MockupBuilderController.emailMockup));

// ── Presentations (AI Presentation Builder) ──
router.get("/api/presentations", isAuthenticated, asyncHandler(PresentationController.list));
router.post("/api/presentations", isAuthenticated, presentationUpload.array('files', 10), asyncHandler(PresentationController.create));
router.post("/api/presentations/import-hubspot", isAuthenticated, asyncHandler(PresentationController.importHubspot));
router.post("/api/presentations/:id/generate", isAuthenticated, asyncHandler(PresentationController.generate));
router.delete("/api/presentations/:id", isAuthenticated, asyncHandler(PresentationController.delete));

// ── Product Comments ──
router.get("/api/projects/:projectId/product-comments", isAuthenticated, asyncHandler(ProductCommentController.list));
router.post("/api/projects/:projectId/product-comments", isAuthenticated, asyncHandler(ProductCommentController.create));

// ── Presentation Share Link (authenticated) ──
router.post("/api/projects/:projectId/presentation/share-link", isAuthenticated, asyncHandler(PresentationShareController.createShareLink));

// ── Public Presentation (NO AUTH) ──
router.get("/api/presentation/:token", asyncHandler(PresentationShareController.getPublicPresentation));
router.post("/api/presentation/:token/comments", asyncHandler(PresentationShareController.postPublicComment));

// ── Cloudinary Upload ──
router.post("/api/cloudinary/upload", isAuthenticated, upload.single('file'), asyncHandler(CloudinaryUploadController.upload));

// ── Seed Dummy Data ──
router.post("/api/seed-dummy-data", isAuthenticated, asyncHandler(SeedController.seed));

export default router;
