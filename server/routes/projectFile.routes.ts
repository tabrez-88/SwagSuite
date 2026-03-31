import { Router } from "express";
import { ProjectFileController } from "../controllers/projectFile.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// List project files
router.get("/api/projects/:projectId/files", isAuthenticated, asyncHandler(ProjectFileController.list));

// Upload files to project
router.post("/api/projects/:projectId/files", isAuthenticated, (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Project file upload failed:', errorMessage);
      return res.status(400).json({ error: errorMessage || "File upload failed" });
    }
    next();
  });
}, asyncHandler(ProjectFileController.upload));

// Delete project file
router.delete("/api/projects/:projectId/files/:fileId", isAuthenticated, asyncHandler(ProjectFileController.delete));

// Send proof to customer
router.post("/api/projects/:projectId/send-proof", isAuthenticated, asyncHandler(ProjectFileController.sendProof));

export default router;
