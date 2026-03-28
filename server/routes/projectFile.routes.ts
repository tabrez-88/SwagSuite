import { Router } from "express";
import { ProjectFileController } from "../controllers/projectFile.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// List project files
router.get("/api/projects/:projectId/files", isAuthenticated, asyncHandler(ProjectFileController.list));

// Upload files to project
router.post("/api/projects/:projectId/files", isAuthenticated, upload.array("files", 10), asyncHandler(ProjectFileController.upload));

// Delete project file
router.delete("/api/projects/:projectId/files/:fileId", isAuthenticated, asyncHandler(ProjectFileController.delete));

// Send proof to customer
router.post("/api/projects/:projectId/send-proof", isAuthenticated, asyncHandler(ProjectFileController.sendProof));

export default router;
