import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { DecoratorMatrixController } from "../controllers/decoratorMatrix.controller";

const router = Router();

// ── Matrices per supplier ──
router.get("/api/suppliers/:supplierId/matrices", isAuthenticated, DecoratorMatrixController.listBySupplier);
router.post("/api/suppliers/:supplierId/matrices", isAuthenticated, DecoratorMatrixController.createMatrix);

// ── Lookup (auto-populate) — must be before :matrixId wildcard ──
router.get("/api/matrices/lookup", isAuthenticated, DecoratorMatrixController.lookup);

// ── Matrix CRUD ──
router.get("/api/matrices/:matrixId", isAuthenticated, DecoratorMatrixController.getMatrix);
router.patch("/api/matrices/:matrixId", isAuthenticated, DecoratorMatrixController.updateMatrix);
router.delete("/api/matrices/:matrixId", isAuthenticated, DecoratorMatrixController.deleteMatrix);

// ── Matrix Entries ──
router.get("/api/matrices/:matrixId/entries", isAuthenticated, DecoratorMatrixController.listEntries);
router.post("/api/matrices/:matrixId/entries", isAuthenticated, DecoratorMatrixController.createEntry);
router.patch("/api/matrices/:matrixId/entries/:entryId", isAuthenticated, DecoratorMatrixController.updateEntry);
router.delete("/api/matrices/:matrixId/entries/:entryId", isAuthenticated, DecoratorMatrixController.deleteEntry);

export default router;
