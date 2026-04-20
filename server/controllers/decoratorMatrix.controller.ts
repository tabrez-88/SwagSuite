import type { Request, Response } from "express";

export class DecoratorMatrixController {
  // ── List matrices for a supplier ──
  static async listBySupplier(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const matrices = await db.select().from(decoratorMatrices)
        .where(eq(decoratorMatrices.supplierId, req.params.supplierId))
        .orderBy(decoratorMatrices.name);
      res.json(matrices);
    } catch (error) {
      console.error("Error listing decorator matrices:", error);
      res.status(500).json({ message: "Failed to list matrices" });
    }
  }

  // ── Get matrix with all nested data (breakdowns, rows, cells) ──
  static async getMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixBreakdowns, decoratorMatrixRows, decoratorMatrixCells } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [matrix] = await db.select().from(decoratorMatrices)
        .where(eq(decoratorMatrices.id, req.params.matrixId));
      if (!matrix) return res.status(404).json({ message: "Matrix not found" });

      const [breakdowns, rows, cells] = await Promise.all([
        db.select().from(decoratorMatrixBreakdowns)
          .where(eq(decoratorMatrixBreakdowns.matrixId, matrix.id))
          .orderBy(decoratorMatrixBreakdowns.sortOrder),
        db.select().from(decoratorMatrixRows)
          .where(eq(decoratorMatrixRows.matrixId, matrix.id))
          .orderBy(decoratorMatrixRows.sortOrder),
        db.select().from(decoratorMatrixCells)
          .where(eq(decoratorMatrixCells.matrixId, matrix.id)),
      ]);

      res.json({ ...matrix, breakdowns, rows, cells });
    } catch (error) {
      console.error("Error getting decorator matrix:", error);
      res.status(500).json({ message: "Failed to get matrix" });
    }
  }

  // ── Create matrix with default rows/breakdowns based on type ──
  static async createMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixBreakdowns, decoratorMatrixRows } = await import("@shared/schema");

      const { chargeType = "run", displayType = "table", ...rest } = req.body;

      const [matrix] = await db.insert(decoratorMatrices).values({
        ...rest,
        supplierId: req.params.supplierId,
        chargeType,
        displayType,
      }).returning();

      // Create default rows and breakdowns based on display type
      if (displayType === "table") {
        // Create 3 default breakdowns (qty columns)
        await db.insert(decoratorMatrixBreakdowns).values([
          { matrixId: matrix.id, minQuantity: 12, maxQuantity: 24, sortOrder: 0 },
          { matrixId: matrix.id, minQuantity: 25, maxQuantity: 72, sortOrder: 1 },
          { matrixId: matrix.id, minQuantity: 73, maxQuantity: null, sortOrder: 2 },
        ]);
        // Create 3 default rows
        await db.insert(decoratorMatrixRows).values([
          { matrixId: matrix.id, rowLabel: "1", sortOrder: 0 },
          { matrixId: matrix.id, rowLabel: "2", sortOrder: 1 },
          { matrixId: matrix.id, rowLabel: "3", sortOrder: 2 },
        ]);
        // Cells get created when user saves grid
      } else if (displayType === "per_item" || displayType === "list") {
        // Create 1 default row
        await db.insert(decoratorMatrixRows).values([
          { matrixId: matrix.id, rowLabel: "New charge", unitCost: "0.0000", sortOrder: 0 },
        ]);
      }

      // Return full matrix
      const { decoratorMatrixCells } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [breakdowns, rows, cells] = await Promise.all([
        db.select().from(decoratorMatrixBreakdowns).where(eq(decoratorMatrixBreakdowns.matrixId, matrix.id)).orderBy(decoratorMatrixBreakdowns.sortOrder),
        db.select().from(decoratorMatrixRows).where(eq(decoratorMatrixRows.matrixId, matrix.id)).orderBy(decoratorMatrixRows.sortOrder),
        db.select().from(decoratorMatrixCells).where(eq(decoratorMatrixCells.matrixId, matrix.id)),
      ]);

      res.status(201).json({ ...matrix, breakdowns, rows, cells });
    } catch (error) {
      console.error("Error creating decorator matrix:", error);
      res.status(500).json({ message: "Failed to create matrix" });
    }
  }

  // ── Update matrix metadata ──
  static async updateMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [updated] = await db.update(decoratorMatrices)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(decoratorMatrices.id, req.params.matrixId))
        .returning();
      if (!updated) return res.status(404).json({ message: "Matrix not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating decorator matrix:", error);
      res.status(500).json({ message: "Failed to update matrix" });
    }
  }

  // ── Delete matrix (cascades to breakdowns, rows, cells) ──
  static async deleteMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(decoratorMatrices).where(eq(decoratorMatrices.id, req.params.matrixId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting decorator matrix:", error);
      res.status(500).json({ message: "Failed to delete matrix" });
    }
  }

  // ── Copy matrix + breakdowns + rows + cells ──
  static async copyMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixBreakdowns, decoratorMatrixRows, decoratorMatrixCells } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [original] = await db.select().from(decoratorMatrices)
        .where(eq(decoratorMatrices.id, req.params.matrixId));
      if (!original) return res.status(404).json({ message: "Matrix not found" });

      // Copy matrix
      const [copy] = await db.insert(decoratorMatrices).values({
        supplierId: original.supplierId,
        name: `${original.name} (Copy)`,
        chargeType: original.chargeType,
        displayType: original.displayType,
        description: original.description,
        rowBasis: original.rowBasis,
        increment: original.increment,
        units: original.units,
        isDefault: false,
        notes: original.notes,
      }).returning();

      // Copy breakdowns
      const origBreakdowns = await db.select().from(decoratorMatrixBreakdowns)
        .where(eq(decoratorMatrixBreakdowns.matrixId, original.id));
      const breakdownIdMap: Record<string, string> = {};

      if (origBreakdowns.length > 0) {
        const newBreakdowns = await db.insert(decoratorMatrixBreakdowns).values(
          origBreakdowns.map(b => ({
            matrixId: copy.id,
            minQuantity: b.minQuantity,
            maxQuantity: b.maxQuantity,
            sortOrder: b.sortOrder,
          }))
        ).returning();
        origBreakdowns.forEach((b, i) => { breakdownIdMap[b.id] = newBreakdowns[i].id; });
      }

      // Copy rows
      const origRows = await db.select().from(decoratorMatrixRows)
        .where(eq(decoratorMatrixRows.matrixId, original.id));
      const rowIdMap: Record<string, string> = {};

      if (origRows.length > 0) {
        const newRows = await db.insert(decoratorMatrixRows).values(
          origRows.map(r => ({
            matrixId: copy.id,
            rowLabel: r.rowLabel,
            unitCost: r.unitCost,
            perUnit: r.perUnit,
            sortOrder: r.sortOrder,
          }))
        ).returning();
        origRows.forEach((r, i) => { rowIdMap[r.id] = newRows[i].id; });
      }

      // Copy cells
      const origCells = await db.select().from(decoratorMatrixCells)
        .where(eq(decoratorMatrixCells.matrixId, original.id));

      if (origCells.length > 0) {
        await db.insert(decoratorMatrixCells).values(
          origCells.map(c => ({
            matrixId: copy.id,
            rowId: rowIdMap[c.rowId],
            breakdownId: breakdownIdMap[c.breakdownId],
            price: c.price,
          }))
        );
      }

      // Return full copied matrix
      const [breakdowns, rows, cells] = await Promise.all([
        db.select().from(decoratorMatrixBreakdowns).where(eq(decoratorMatrixBreakdowns.matrixId, copy.id)).orderBy(decoratorMatrixBreakdowns.sortOrder),
        db.select().from(decoratorMatrixRows).where(eq(decoratorMatrixRows.matrixId, copy.id)).orderBy(decoratorMatrixRows.sortOrder),
        db.select().from(decoratorMatrixCells).where(eq(decoratorMatrixCells.matrixId, copy.id)),
      ]);

      res.status(201).json({ ...copy, breakdowns, rows, cells });
    } catch (error) {
      console.error("Error copying decorator matrix:", error);
      res.status(500).json({ message: "Failed to copy matrix" });
    }
  }

  // ── Add breakdown (qty column) ──
  static async addBreakdown(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixBreakdowns } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { sql } = await import("drizzle-orm");

      // Get current max sortOrder
      const existing = await db.select().from(decoratorMatrixBreakdowns)
        .where(eq(decoratorMatrixBreakdowns.matrixId, req.params.matrixId))
        .orderBy(decoratorMatrixBreakdowns.sortOrder);
      const nextSort = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

      const [breakdown] = await db.insert(decoratorMatrixBreakdowns).values({
        matrixId: req.params.matrixId,
        minQuantity: req.body.minQuantity ?? 0,
        maxQuantity: req.body.maxQuantity ?? null,
        sortOrder: nextSort,
      }).returning();

      res.status(201).json(breakdown);
    } catch (error) {
      console.error("Error adding breakdown:", error);
      res.status(500).json({ message: "Failed to add breakdown" });
    }
  }

  // ── Remove breakdown ──
  static async removeBreakdown(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixBreakdowns } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(decoratorMatrixBreakdowns)
        .where(eq(decoratorMatrixBreakdowns.id, req.params.breakdownId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing breakdown:", error);
      res.status(500).json({ message: "Failed to remove breakdown" });
    }
  }

  // ── Update breakdown ──
  static async updateBreakdown(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixBreakdowns } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [updated] = await db.update(decoratorMatrixBreakdowns)
        .set(req.body)
        .where(eq(decoratorMatrixBreakdowns.id, req.params.breakdownId))
        .returning();
      if (!updated) return res.status(404).json({ message: "Breakdown not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating breakdown:", error);
      res.status(500).json({ message: "Failed to update breakdown" });
    }
  }

  // ── Add row ──
  static async addRow(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixRows } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const existing = await db.select().from(decoratorMatrixRows)
        .where(eq(decoratorMatrixRows.matrixId, req.params.matrixId))
        .orderBy(decoratorMatrixRows.sortOrder);
      const nextSort = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

      const [row] = await db.insert(decoratorMatrixRows).values({
        matrixId: req.params.matrixId,
        rowLabel: req.body.rowLabel ?? `${nextSort + 1}`,
        unitCost: req.body.unitCost ?? null,
        perUnit: req.body.perUnit ?? null,
        sortOrder: nextSort,
      }).returning();

      res.status(201).json(row);
    } catch (error) {
      console.error("Error adding row:", error);
      res.status(500).json({ message: "Failed to add row" });
    }
  }

  // ── Remove row ──
  static async removeRow(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixRows } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(decoratorMatrixRows)
        .where(eq(decoratorMatrixRows.id, req.params.rowId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing row:", error);
      res.status(500).json({ message: "Failed to remove row" });
    }
  }

  // ── Update row ──
  static async updateRow(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixRows } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [updated] = await db.update(decoratorMatrixRows)
        .set(req.body)
        .where(eq(decoratorMatrixRows.id, req.params.rowId))
        .returning();
      if (!updated) return res.status(404).json({ message: "Row not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating row:", error);
      res.status(500).json({ message: "Failed to update row" });
    }
  }

  // ── Update single cell ──
  static async updateCell(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixCells } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [updated] = await db.update(decoratorMatrixCells)
        .set({ price: req.body.price })
        .where(eq(decoratorMatrixCells.id, req.params.cellId))
        .returning();
      if (!updated) return res.status(404).json({ message: "Cell not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating cell:", error);
      res.status(500).json({ message: "Failed to update cell" });
    }
  }

  // ── Batch save entire grid (all cells at once) ──
  static async saveGrid(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixCells } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const matrixId = req.params.matrixId;
      const { cells } = req.body; // Array of { rowId, breakdownId, price }

      if (!Array.isArray(cells)) {
        return res.status(400).json({ message: "cells must be an array" });
      }

      // Delete existing cells for this matrix
      await db.delete(decoratorMatrixCells)
        .where(eq(decoratorMatrixCells.matrixId, matrixId));

      // Insert all new cells
      if (cells.length > 0) {
        await db.insert(decoratorMatrixCells).values(
          cells.map((c: any) => ({
            matrixId,
            rowId: c.rowId,
            breakdownId: c.breakdownId,
            price: c.price || "0",
          }))
        );
      }

      // Return updated cells
      const updatedCells = await db.select().from(decoratorMatrixCells)
        .where(eq(decoratorMatrixCells.matrixId, matrixId));

      res.json(updatedCells);
    } catch (error) {
      console.error("Error saving grid:", error);
      res.status(500).json({ message: "Failed to save grid" });
    }
  }

  // ── Lookup: find matrix pricing for order-side picker ──
  static async lookup(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixBreakdowns, decoratorMatrixRows, decoratorMatrixCells } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const { supplierId } = req.query;
      if (!supplierId) {
        return res.status(400).json({ message: "supplierId is required" });
      }

      // Find matrices for this supplier
      const matrices = await db.select().from(decoratorMatrices)
        .where(eq(decoratorMatrices.supplierId, supplierId as string));

      if (matrices.length === 0) {
        return res.json({ found: false, matrices: [] });
      }

      // For each matrix, fetch full data
      const fullMatrices = await Promise.all(matrices.map(async (matrix) => {
        const [breakdowns, rows, cells] = await Promise.all([
          db.select().from(decoratorMatrixBreakdowns)
            .where(eq(decoratorMatrixBreakdowns.matrixId, matrix.id))
            .orderBy(decoratorMatrixBreakdowns.sortOrder),
          db.select().from(decoratorMatrixRows)
            .where(eq(decoratorMatrixRows.matrixId, matrix.id))
            .orderBy(decoratorMatrixRows.sortOrder),
          db.select().from(decoratorMatrixCells)
            .where(eq(decoratorMatrixCells.matrixId, matrix.id)),
        ]);
        return { ...matrix, breakdowns, rows, cells };
      }));

      res.json({ found: true, matrices: fullMatrices });
    } catch (error) {
      console.error("Error looking up decorator matrix:", error);
      res.status(500).json({ message: "Failed to lookup matrix" });
    }
  }
}
