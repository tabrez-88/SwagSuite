import { Router } from "express";
import { MediaLibraryController } from "../controllers/mediaLibrary.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// Media Library CRUD
router.get("/api/media-library", isAuthenticated, asyncHandler(MediaLibraryController.list));
router.get("/api/media-library/:id", isAuthenticated, asyncHandler(MediaLibraryController.getById));
router.post("/api/media-library/upload", isAuthenticated, (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "File upload failed" });
    }
    next();
  });
}, asyncHandler(MediaLibraryController.upload));
router.patch("/api/media-library/:id", isAuthenticated, asyncHandler(MediaLibraryController.update));
router.delete("/api/media-library/:id", isAuthenticated, asyncHandler(MediaLibraryController.delete));

// Link library files to order
router.post("/api/orders/:orderId/files/from-library", isAuthenticated, asyncHandler(MediaLibraryController.linkToOrder));

export default router;
