import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { isAdmin } from "../config/adminAuth";
import { DecoratorMatrixController } from "../controllers/decoratorMatrix.controller";

const router = Router();

// Reads (lookup + view) allowed for any authenticated user.
// Writes (create/update/delete/apply/copy) are admin-only.

// ── Matrices per supplier ──
router.get("/api/suppliers/:supplierId/matrices", isAuthenticated, DecoratorMatrixController.listBySupplier);
router.post("/api/suppliers/:supplierId/matrices", isAuthenticated, isAdmin, DecoratorMatrixController.createMatrix);

// ── Lookup (auto-populate) — must be before :matrixId wildcard ──
router.get("/api/matrices/lookup", isAuthenticated, DecoratorMatrixController.lookup);

// ── Apply matrix to artwork (creates all charges) ──
router.post("/api/matrices/apply", isAuthenticated, DecoratorMatrixController.applyToArtwork);

// ── Matrix CRUD ──
router.get("/api/matrices/:matrixId", isAuthenticated, DecoratorMatrixController.getMatrix);
router.patch("/api/matrices/:matrixId", isAuthenticated, isAdmin, DecoratorMatrixController.updateMatrix);
router.delete("/api/matrices/:matrixId", isAuthenticated, isAdmin, DecoratorMatrixController.deleteMatrix);
router.post("/api/matrices/:matrixId/copy", isAuthenticated, isAdmin, DecoratorMatrixController.copyMatrix);

// ── Matrix Entries ──
router.get("/api/matrices/:matrixId/entries", isAuthenticated, DecoratorMatrixController.listEntries);
router.post("/api/matrices/:matrixId/entries", isAuthenticated, isAdmin, DecoratorMatrixController.createEntry);
router.patch("/api/matrices/:matrixId/entries/:entryId", isAuthenticated, isAdmin, DecoratorMatrixController.updateEntry);
router.delete("/api/matrices/:matrixId/entries/:entryId", isAuthenticated, isAdmin, DecoratorMatrixController.deleteEntry);

export default router;
