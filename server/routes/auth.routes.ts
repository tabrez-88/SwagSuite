import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

// Auth - current user
router.get("/api/auth/user", isAuthenticated, AuthController.getCurrentUser);

// Invitations (authenticated - admin/manager)
router.post("/api/invitations", isAuthenticated, AuthController.createInvitation);
router.get("/api/invitations/pending", isAuthenticated, AuthController.getPendingInvitations);
router.delete("/api/invitations/:id", isAuthenticated, AuthController.deleteInvitation);

// Invitations (public)
router.post("/api/invitations/accept", AuthController.acceptInvitation);
router.get("/api/invitations/verify/:token", AuthController.verifyInvitation);

// Password reset (public)
router.post("/api/auth/forgot-password", AuthController.forgotPassword);
router.post("/api/auth/reset-password", AuthController.resetPassword);

// Users management (authenticated)
router.get("/api/users", isAuthenticated, AuthController.listUsers);
router.patch("/api/users/:id/role", isAuthenticated, AuthController.updateUserRole);
router.post("/api/users/avatar", isAuthenticated, AuthController.uploadAvatar);
router.patch("/api/users/profile-image", isAuthenticated, AuthController.updateProfileImage);

export default router;
