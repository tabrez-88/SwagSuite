import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Admin / Company settings
router.get("/api/admin/settings", isAuthenticated, asyncHandler(SettingsController.getCompanySettings));
router.put("/api/admin/settings/features", isAuthenticated, asyncHandler(SettingsController.updateFeatureToggles));
router.put("/api/admin/settings/general", isAuthenticated, asyncHandler(SettingsController.updateGeneralSettings));

// Integration settings
router.get("/api/settings/integrations", isAuthenticated, asyncHandler(SettingsController.getIntegrationSettings));
router.post("/api/settings/integrations", isAuthenticated, asyncHandler(SettingsController.saveIntegrationSettings));

// Branding
router.get("/api/settings/branding", asyncHandler(SettingsController.getBranding));
router.post("/api/settings/branding", isAuthenticated, asyncHandler(SettingsController.saveBranding));
router.post("/api/settings/logo", isAuthenticated, SettingsController.uploadLogo); // no asyncHandler — multer callback handles it

// User email settings
router.get("/api/user-email-settings", isAuthenticated, asyncHandler(SettingsController.getUserEmailSettings));
router.post("/api/user-email-settings", isAuthenticated, asyncHandler(SettingsController.saveUserEmailSettings));
router.delete("/api/user-email-settings", isAuthenticated, asyncHandler(SettingsController.deleteUserEmailSettings));
router.post("/api/user-email-settings/test-smtp", isAuthenticated, asyncHandler(SettingsController.testSmtp));
router.post("/api/user-email-settings/test-imap", isAuthenticated, asyncHandler(SettingsController.testImap));

// Test email + geocode
router.post("/api/settings/test-email", isAuthenticated, asyncHandler(SettingsController.testEmail));
router.get("/api/geocode/search", isAuthenticated, asyncHandler(SettingsController.geocodeSearch));

export default router;
