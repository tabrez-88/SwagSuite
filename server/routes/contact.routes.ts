import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ContactController } from "../controllers/contact.controller";

const router = Router();

router.get("/api/contacts", isAuthenticated, asyncHandler(ContactController.list));
router.get("/api/contacts/:id", isAuthenticated, asyncHandler(ContactController.getById));
router.post("/api/contacts", isAuthenticated, asyncHandler(ContactController.create));
router.patch("/api/contacts/:id", isAuthenticated, asyncHandler(ContactController.update));
router.delete("/api/contacts/:id", isAuthenticated, asyncHandler(ContactController.delete));

export default router;
