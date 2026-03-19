import { Router } from "express";
import { ArtworkKanbanController } from "../controllers/artworkKanban.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Artwork Kanban columns
router.get("/api/artwork/columns", isAuthenticated, asyncHandler(ArtworkKanbanController.getColumns));
router.post("/api/artwork/columns/initialize", isAuthenticated, asyncHandler(ArtworkKanbanController.initializeColumns));
router.post("/api/artwork/columns", isAuthenticated, asyncHandler(ArtworkKanbanController.createColumn));

// Artwork Kanban cards
router.get("/api/artwork/cards", isAuthenticated, asyncHandler(ArtworkKanbanController.getCards));
router.patch("/api/artwork/cards/:id/move", isAuthenticated, asyncHandler(ArtworkKanbanController.moveCard));

export default router;
