import { Router } from "express";
import { OrderFileController } from "../controllers/orderFile.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// List order files
router.get("/api/orders/:orderId/files", isAuthenticated, asyncHandler(OrderFileController.list));

// Upload files to order
router.post("/api/orders/:orderId/files", isAuthenticated, upload.array("files", 10), asyncHandler(OrderFileController.upload));

// Delete order file
router.delete("/api/orders/:orderId/files/:fileId", isAuthenticated, asyncHandler(OrderFileController.delete));

// Send proof to customer
router.post("/api/orders/:orderId/send-proof", isAuthenticated, asyncHandler(OrderFileController.sendProof));

export default router;
