import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { isAdmin } from "../config/adminAuth";
import { DecoratorMatrixController } from "../controllers/decoratorMatrix.controller";

const router = Router();

// Reads allowed for any authenticated user.
// Writes (create/update/delete/copy) are admin-only.

// ── Matrices per supplier ──
router.get("/api/suppliers/:supplierId/matrices", isAuthenticated, DecoratorMatrixController.listBySupplier);
router.post("/api/suppliers/:supplierId/matrices", isAuthenticated, isAdmin, DecoratorMatrixController.createMatrix);

// ── Lookup (order-side picker) — must be before :matrixId wildcard ──
router.get("/api/matrices/lookup", isAuthenticated, DecoratorMatrixController.lookup);

// ── Matrix CRUD ──
router.get("/api/matrices/:matrixId", isAuthenticated, DecoratorMatrixController.getMatrix);
router.patch("/api/matrices/:matrixId", isAuthenticated, isAdmin, DecoratorMatrixController.updateMatrix);
router.delete("/api/matrices/:matrixId", isAuthenticated, isAdmin, DecoratorMatrixController.deleteMatrix);
router.post("/api/matrices/:matrixId/copy", isAuthenticated, isAdmin, DecoratorMatrixController.copyMatrix);

// ── Grid batch save ──
router.put("/api/matrices/:matrixId/grid", isAuthenticated, isAdmin, DecoratorMatrixController.saveGrid);

// ── Breakdowns (qty columns) ──
router.post("/api/matrices/:matrixId/breakdowns", isAuthenticated, isAdmin, DecoratorMatrixController.addBreakdown);
router.patch("/api/matrices/:matrixId/breakdowns/:breakdownId", isAuthenticated, isAdmin, DecoratorMatrixController.updateBreakdown);
router.delete("/api/matrices/:matrixId/breakdowns/:breakdownId", isAuthenticated, isAdmin, DecoratorMatrixController.removeBreakdown);

// ── Rows ──
router.post("/api/matrices/:matrixId/rows", isAuthenticated, isAdmin, DecoratorMatrixController.addRow);
router.patch("/api/matrices/:matrixId/rows/:rowId", isAuthenticated, isAdmin, DecoratorMatrixController.updateRow);
router.delete("/api/matrices/:matrixId/rows/:rowId", isAuthenticated, isAdmin, DecoratorMatrixController.removeRow);

// ── Cells ──
router.patch("/api/matrices/:matrixId/cells/:cellId", isAuthenticated, isAdmin, DecoratorMatrixController.updateCell);

export default router;
