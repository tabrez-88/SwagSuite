import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { upload } from "../config/cloudinary";
import { ProjectController } from "../controllers/project.controller";

const router = Router();

// ── Projects CRUD ──
router.get("/api/projects", isAuthenticated, ProjectController.list);
router.get("/api/projects/:id", isAuthenticated, ProjectController.getById);
router.post("/api/projects", isAuthenticated, ProjectController.create);
router.patch("/api/projects/:id", isAuthenticated, ProjectController.update);
router.post("/api/projects/:projectId/duplicate", isAuthenticated, ProjectController.duplicate);
router.post("/api/projects/:id/recalculate-total", isAuthenticated, ProjectController.recalculateTotal);

// ── Batch: Items with all details (lines, charges, artwork) ──
router.get("/api/projects/:projectId/items-with-details", isAuthenticated, ProjectController.listItemsWithDetails);

// ── Project Items ──
router.get("/api/projects/:projectId/items", isAuthenticated, ProjectController.listItems);
router.post("/api/projects/:projectId/items", isAuthenticated, ProjectController.createItem);
router.patch("/api/projects/:projectId/items/:itemId", isAuthenticated, ProjectController.updateItem);
router.delete("/api/projects/:projectId/items/:itemId", isAuthenticated, ProjectController.deleteItem);
router.post("/api/projects/:projectId/items/:itemId/duplicate", isAuthenticated, ProjectController.duplicateItem);

// ── Artwork Items (per project item) ──
router.get("/api/project-items/:itemId/artworks", isAuthenticated, ProjectController.listArtworks);
router.post("/api/project-items/:itemId/artworks", isAuthenticated, upload.single('file'), ProjectController.createArtwork);
router.put("/api/project-items/:itemId/artworks/:artworkId", isAuthenticated, upload.single('file'), ProjectController.updateArtwork);
router.delete("/api/project-items/:itemId/artworks/:artworkId", isAuthenticated, ProjectController.deleteArtwork);

// ── Artwork Item Files (multiple files per artwork) ──
router.get("/api/artworks/:artworkId/files", isAuthenticated, ProjectController.listArtworkFiles);
router.post("/api/artworks/:artworkId/files", isAuthenticated, ProjectController.addArtworkFile);
router.delete("/api/artworks/:artworkId/files/:fileId", isAuthenticated, ProjectController.removeArtworkFile);

// ── Copy Artwork Between Products ──
router.post("/api/project-items/:itemId/artworks/copy-from/:sourceArtworkId", isAuthenticated, ProjectController.copyArtwork);

// ── Artwork Charges ──
router.get("/api/artworks/:artworkId/charges", isAuthenticated, ProjectController.listArtworkCharges);
router.post("/api/artworks/:artworkId/charges", isAuthenticated, ProjectController.createArtworkCharge);
router.patch("/api/artworks/:artworkId/charges/:chargeId", isAuthenticated, ProjectController.updateArtworkCharge);
router.delete("/api/artworks/:artworkId/charges/:chargeId", isAuthenticated, ProjectController.deleteArtworkCharge);

// ── Item Lines ──
router.get("/api/project-items/:itemId/lines", isAuthenticated, ProjectController.listLines);
router.post("/api/project-items/:itemId/lines", isAuthenticated, ProjectController.createLine);
router.patch("/api/project-items/:itemId/lines/:lineId", isAuthenticated, ProjectController.updateLine);
router.delete("/api/project-items/:itemId/lines/:lineId", isAuthenticated, ProjectController.deleteLine);

// ── Additional Charges ──
router.get("/api/project-items/:itemId/charges", isAuthenticated, ProjectController.listCharges);
router.post("/api/project-items/:itemId/charges", isAuthenticated, ProjectController.createCharge);
router.patch("/api/project-items/:itemId/charges/:chargeId", isAuthenticated, ProjectController.updateCharge);
router.delete("/api/project-items/:itemId/charges/:chargeId", isAuthenticated, ProjectController.deleteCharge);

// ── Service Charges ──
router.get("/api/projects/:projectId/service-charges", isAuthenticated, ProjectController.listServiceCharges);
router.post("/api/projects/:projectId/service-charges", isAuthenticated, ProjectController.createServiceCharge);
router.patch("/api/projects/:projectId/service-charges/:chargeId", isAuthenticated, ProjectController.updateServiceCharge);
router.delete("/api/projects/:projectId/service-charges/:chargeId", isAuthenticated, ProjectController.deleteServiceCharge);

export default router;
