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
      const matrixType = matrix.matrixType || "run_charge_table";

      // Fetch entries
      const entries = await db.select().from(decoratorMatrixEntries)
        .where(eq(decoratorMatrixEntries.matrixId, matrix.id))
        .orderBy(decoratorMatrixEntries.minQuantity);

      // For non-table types, return all entries for client-side handling
      if (matrixType !== "run_charge_table") {
        return res.json({
          found: true,
          matrixName: matrix.name,
          matrixType,
          entries: entries.map(e => ({
            rowLabel: e.rowLabel,
            unitCost: e.unitCost,
            setupCost: e.setupCost,
            runCost: e.runCost,
            perUnit: e.perUnit,
            notes: e.notes,
          })),
        });
      }

      // run_charge_table: match by quantity range (existing behavior)
      const match = entries.find(e =>
        qty >= e.minQuantity && (e.maxQuantity === null || qty <= e.maxQuantity)
      );

      if (!match) {
        return res.json({ found: false, runCost: null, setupCost: null, matrixName: matrix.name, matrixType });
      }

      res.json({
        found: true,
        matrixName: matrix.name,
        matrixType,
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

  // ── Apply: look up matrix and create all charges on an artwork in one shot ──

  static async applyToArtwork(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixEntries, artworkCharges, artworkItems } = await import("@shared/schema");
      const { eq, and, like } = await import("drizzle-orm");

      const { artworkId, supplierId, quantity } = req.body;
      if (!artworkId || !supplierId) {
        return res.status(400).json({ message: "artworkId and supplierId are required" });
      }

      // Get artwork to determine imprint method
      const [artwork] = await db.select().from(artworkItems).where(eq(artworkItems.id, artworkId));
      if (!artwork) return res.status(404).json({ message: "Artwork not found" });

      const method = artwork.artworkType;
      if (!method) return res.status(400).json({ message: "Artwork has no imprint method set" });

      const qty = parseInt(quantity) || 1;

      // Find matching matrix
      const matrices = await db.select().from(decoratorMatrices)
        .where(and(
          eq(decoratorMatrices.supplierId, supplierId),
          eq(decoratorMatrices.decorationMethod, method),
        ));

      if (matrices.length === 0) {
        return res.json({ applied: false, message: "No matrix found for this decorator + method", charges: [] });
      }

      const matrix = matrices.find(m => m.isDefault) || matrices[0];
      const matrixType = matrix.matrixType || "run_charge_table";

      // Fetch entries
      const entries = await db.select().from(decoratorMatrixEntries)
        .where(eq(decoratorMatrixEntries.matrixId, matrix.id))
        .orderBy(decoratorMatrixEntries.minQuantity);

      if (entries.length === 0) {
        return res.json({ applied: false, message: "Matrix has no pricing entries", charges: [] });
      }

      // Build charges to create based on matrix type
      const chargesToCreate: Array<{
        artworkItemId: string;
        chargeName: string;
        chargeCategory: string;
        netCost: string;
        margin: string;
        retailPrice: string;
        quantity: number;
        displayMode: string;
      }> = [];

      if (matrixType === "run_charge_table") {
        // Find entry matching quantity range
        const match = entries.find(e =>
          qty >= e.minQuantity && (e.maxQuantity === null || qty <= e.maxQuantity)
        );
        if (match) {
          const runCost = parseFloat(match.runCost || "0");
          const setupCost = parseFloat(match.setupCost || "0");
          if (runCost > 0) {
            chargesToCreate.push({
              artworkItemId: artworkId,
              chargeName: `${method} imprint`,
              chargeCategory: "run",
              netCost: runCost.toFixed(2),
              margin: "0",
              retailPrice: runCost.toFixed(2),
              quantity: 1,
              displayMode: "display_to_client",
            });
          }
          if (setupCost > 0) {
            chargesToCreate.push({
              artworkItemId: artworkId,
              chargeName: `${method} setup`,
              chargeCategory: "fixed",
              netCost: setupCost.toFixed(2),
              margin: "0",
              retailPrice: setupCost.toFixed(2),
              quantity: 1,
              displayMode: "display_to_client",
            });
          }
          // Additional color cost
          const addlCost = parseFloat(match.additionalColorCost || "0");
          if (addlCost > 0 && match.colorCount && match.colorCount > 1) {
            chargesToCreate.push({
              artworkItemId: artworkId,
              chargeName: `${method} additional color`,
              chargeCategory: "run",
              netCost: addlCost.toFixed(2),
              margin: "0",
              retailPrice: addlCost.toFixed(2),
              quantity: 1,
              displayMode: "display_to_client",
            });
          }
        }
      } else if (matrixType === "run_charge_per_item") {
        // Each entry becomes a run charge
        for (const e of entries) {
          const cost = parseFloat(e.unitCost || "0");
          if (cost > 0) {
            chargesToCreate.push({
              artworkItemId: artworkId,
              chargeName: e.rowLabel || `${method} charge`,
              chargeCategory: "run",
              netCost: cost.toFixed(2),
              margin: "0",
              retailPrice: cost.toFixed(2),
              quantity: 1,
              displayMode: "display_to_client",
            });
          }
        }
      } else if (matrixType === "fixed_charge_table") {
        // Match by quantity, create fixed charge
        const match = entries.find(e =>
          qty >= e.minQuantity && (e.maxQuantity === null || qty <= e.maxQuantity)
        );
        if (match) {
          const cost = parseFloat(match.unitCost || "0");
          if (cost > 0) {
            chargesToCreate.push({
              artworkItemId: artworkId,
              chargeName: match.rowLabel || `${method} fixed`,
              chargeCategory: "fixed",
              netCost: cost.toFixed(2),
              margin: "0",
              retailPrice: cost.toFixed(2),
              quantity: 1,
              displayMode: "display_to_client",
            });
          }
        }
      } else if (matrixType === "fixed_charge_list") {
        // Each entry becomes a fixed charge
        for (const e of entries) {
          const cost = parseFloat(e.unitCost || "0");
          if (cost > 0) {
            chargesToCreate.push({
              artworkItemId: artworkId,
              chargeName: e.rowLabel || `${method} charge`,
              chargeCategory: "fixed",
              netCost: cost.toFixed(2),
              margin: "0",
              retailPrice: cost.toFixed(2),
              quantity: 1,
              displayMode: "display_to_client",
            });
          }
        }
      }

      if (chargesToCreate.length === 0) {
        return res.json({ applied: false, message: "No applicable charges found in matrix", charges: [] });
      }

      // Delete existing charges on this artwork that were from a matrix (re-apply clean)
      await db.delete(artworkCharges).where(eq(artworkCharges.artworkItemId, artworkId));

      // Insert all new charges
      const created = await db.insert(artworkCharges).values(chargesToCreate).returning();

      res.json({
        applied: true,
        matrixName: matrix.name,
        matrixType,
        charges: created,
      });
    } catch (error) {
      console.error("Error applying decorator matrix:", error);
      res.status(500).json({ message: "Failed to apply matrix" });
    }
  }

  // ── Copy: duplicate matrix + all entries ──

  static async copyMatrix(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { decoratorMatrices, decoratorMatrixEntries } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [original] = await db.select().from(decoratorMatrices)
        .where(eq(decoratorMatrices.id, req.params.matrixId));
      if (!original) return res.status(404).json({ message: "Matrix not found" });

      // Create copy
      const [copy] = await db.insert(decoratorMatrices).values({
        supplierId: original.supplierId,
        name: `${original.name} (Copy)`,
        decorationMethod: original.decorationMethod,
        matrixType: original.matrixType,
        description: original.description,
        rowBasis: original.rowBasis,
        increment: original.increment,
        units: original.units,
        isDefault: false,
        notes: original.notes,
      }).returning();

      // Copy entries
      const entries = await db.select().from(decoratorMatrixEntries)
        .where(eq(decoratorMatrixEntries.matrixId, original.id));

      if (entries.length > 0) {
        await db.insert(decoratorMatrixEntries).values(
          entries.map(e => ({
            matrixId: copy.id,
            rowLabel: e.rowLabel,
            minQuantity: e.minQuantity,
            maxQuantity: e.maxQuantity,
            colorCount: e.colorCount,
            setupCost: e.setupCost,
            runCost: e.runCost,
            unitCost: e.unitCost,
            additionalColorCost: e.additionalColorCost,
            perUnit: e.perUnit,
            notes: e.notes,
          }))
        );
      }

      res.status(201).json(copy);
    } catch (error) {
      console.error("Error copying decorator matrix:", error);
      res.status(500).json({ message: "Failed to copy matrix" });
    }
  }
}
