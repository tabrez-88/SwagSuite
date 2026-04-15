import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { generatedDocsUpload } from "../config/cloudinary";

const router = Router();

// List documents for a project
router.get("/api/projects/:projectId/documents", isAuthenticated, asyncHandler(DocumentController.list));

// Get the next global PO sequence number
router.get("/api/documents/next-po-sequence", isAuthenticated, asyncHandler(DocumentController.nextPoSequence));

// Upload/create a new document
router.post("/api/projects/:projectId/documents", isAuthenticated, (req, res, next) => {
  generatedDocsUpload.single("pdf")(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({ message: "File upload failed", error: err.message });
    }
    next();
  });
}, asyncHandler(DocumentController.create));

// Preview document PDF (inline)
router.get("/api/documents/:documentId/preview", isAuthenticated, asyncHandler(DocumentController.preview));

// Update document (status, metadata, sentAt)
router.patch("/api/documents/:documentId", isAuthenticated, asyncHandler(DocumentController.update));

// Delete document
router.delete("/api/documents/:documentId", isAuthenticated, asyncHandler(DocumentController.delete));

export default router;
