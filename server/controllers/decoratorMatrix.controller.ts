import type { Request, Response } from "express";

export class DecoratorMatrixController {
  // ── Matrices CRUD ──

  static async listBySupplier(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const matrices = await db.select().from(decoratorMatrices)
        .where(eq(decoratorMatrices.supplierId, req.params.supplierId))
        .orderBy(decoratorMatrices.decorationMethod);
      res.json(matrices);
    } catch (error) {
      console.error("Error listing decorator matrices:", error);
      res.status(500).json({ message: "Failed to list matrices" });
    }
  }

  static async getMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixEntries } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [matrix] = await db.select().from(decoratorMatrices).where(eq(decoratorMatrices.id, req.params.matrixId));
      if (!matrix) return res.status(404).json({ message: "Matrix not found" });
      const entries = await db.select().from(decoratorMatrixEntries)
        .where(eq(decoratorMatrixEntries.matrixId, req.params.matrixId))
        .orderBy(decoratorMatrixEntries.minQuantity);
      res.json({ ...matrix, entries });
    } catch (error) {
      console.error("Error getting decorator matrix:", error);
      res.status(500).json({ message: "Failed to get matrix" });
    }
  }

  static async createMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { insertDecoratorMatrixSchema, decoratorMatrices } = await import("@shared/schema");
      const validated = insertDecoratorMatrixSchema.parse({
        ...req.body,
        supplierId: req.params.supplierId,
      });
      const [matrix] = await db.insert(decoratorMatrices).values(validated).returning();
      res.status(201).json(matrix);
    } catch (error) {
      console.error("Error creating decorator matrix:", error);
      res.status(500).json({ message: "Failed to create matrix" });
    }
  }

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

  // ── Matrix Entries CRUD ──

  static async listEntries(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixEntries } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const entries = await db.select().from(decoratorMatrixEntries)
        .where(eq(decoratorMatrixEntries.matrixId, req.params.matrixId))
        .orderBy(decoratorMatrixEntries.minQuantity);
      res.json(entries);
    } catch (error) {
      console.error("Error listing matrix entries:", error);
      res.status(500).json({ message: "Failed to list entries" });
    }
  }

  static async createEntry(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { insertDecoratorMatrixEntrySchema, decoratorMatrixEntries } = await import("@shared/schema");
      const validated = insertDecoratorMatrixEntrySchema.parse({
        ...req.body,
        matrixId: req.params.matrixId,
      });
      const [entry] = await db.insert(decoratorMatrixEntries).values(validated).returning();
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating matrix entry:", error);
      res.status(500).json({ message: "Failed to create entry" });
    }
  }

  static async updateEntry(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixEntries } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const [updated] = await db.update(decoratorMatrixEntries)
        .set(req.body)
        .where(and(
          eq(decoratorMatrixEntries.id, req.params.entryId),
          eq(decoratorMatrixEntries.matrixId, req.params.matrixId),
        ))
        .returning();
      if (!updated) return res.status(404).json({ message: "Entry not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating matrix entry:", error);
      res.status(500).json({ message: "Failed to update entry" });
    }
  }

  static async deleteEntry(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrixEntries } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(decoratorMatrixEntries).where(and(
        eq(decoratorMatrixEntries.id, req.params.entryId),
        eq(decoratorMatrixEntries.matrixId, req.params.matrixId),
      ));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting matrix entry:", error);
      res.status(500).json({ message: "Failed to delete entry" });
    }
  }

  // ── Lookup: auto-populate costs from matrix ──

  static async lookup(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixEntries } = await import("@shared/schema");
      const { eq, and, lte, gte, or, isNull } = await import("drizzle-orm");

      const { supplierId, method, quantity } = req.query;
      if (!supplierId || !method || !quantity) {
        return res.status(400).json({ message: "supplierId, method, and quantity are required" });
      }

      const qty = parseInt(quantity as string) || 0;

      // Find matching matrix for this supplier + method
      const matrices = await db.select().from(decoratorMatrices)
        .where(and(
          eq(decoratorMatrices.supplierId, supplierId as string),
          eq(decoratorMatrices.decorationMethod, method as string),
        ));

      if (matrices.length === 0) {
        return res.json({ found: false, runCost: null, setupCost: null });
      }

      // Use default matrix if available, otherwise first
      const matrix = matrices.find(m => m.isDefault) || matrices[0];

      // Find matching entry by quantity range
      const entries = await db.select().from(decoratorMatrixEntries)
        .where(eq(decoratorMatrixEntries.matrixId, matrix.id))
        .orderBy(decoratorMatrixEntries.minQuantity);

      const match = entries.find(e =>
        qty >= e.minQuantity && (e.maxQuantity === null || qty <= e.maxQuantity)
      );

      if (!match) {
        return res.json({ found: false, runCost: null, setupCost: null, matrixName: matrix.name });
      }

      res.json({
        found: true,
        matrixName: matrix.name,
        runCost: match.runCost,
        setupCost: match.setupCost,
        additionalColorCost: match.additionalColorCost,
        colorCount: match.colorCount,
        minQuantity: match.minQuantity,
        maxQuantity: match.maxQuantity,
      });
    } catch (error) {
      console.error("Error looking up decorator matrix:", error);
      res.status(500).json({ message: "Failed to lookup matrix" });
    }
  }
}
