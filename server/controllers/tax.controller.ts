import type { Request, Response } from "express";
import { db } from "../db";
import { taxCodes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createTaxCodeRequest = z.object({
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  rate: z.string().or(z.number()).transform(v => String(v)),
  taxjarProductCode: z.string().optional().nullable(),
  isExempt: z.boolean().optional().default(false),
  isDefault: z.boolean().optional().default(false),
});

const updateTaxCodeRequest = createTaxCodeRequest.partial();

export class TaxController {
  static async list(_req: Request, res: Response) {
    const codes = await db.select().from(taxCodes).orderBy(taxCodes.label);
    res.json(codes);
  }

  static async create(req: Request, res: Response) {
    const data = createTaxCodeRequest.parse(req.body);

    // If setting as default, clear other defaults first
    if (data.isDefault) {
      await db.update(taxCodes).set({ isDefault: false }).where(eq(taxCodes.isDefault, true));
    }

    const [code] = await db.insert(taxCodes).values(data).returning();
    res.status(201).json(code);
  }

  static async update(req: Request, res: Response) {
    const data = updateTaxCodeRequest.parse(req.body);
    const { id } = req.params;

    // If setting as default, clear other defaults first
    if (data.isDefault) {
      await db.update(taxCodes).set({ isDefault: false }).where(eq(taxCodes.isDefault, true));
    }

    const [updated] = await db
      .update(taxCodes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taxCodes.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Tax code not found" });
    }
    res.json(updated);
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;

    // Check if the tax code is in use
    const { orders, orderItems, orderServiceCharges, companies } = await import("@shared/schema");
    const { or } = await import("drizzle-orm");

    const [usedByOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.defaultTaxCodeId, id)).limit(1);
    const [usedByItem] = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.taxCodeId, id)).limit(1);
    const [usedByService] = await db.select({ id: orderServiceCharges.id }).from(orderServiceCharges).where(eq(orderServiceCharges.taxCodeId, id)).limit(1);
    const [usedByCompany] = await db.select({ id: companies.id }).from(companies).where(eq(companies.defaultTaxCodeId, id)).limit(1);

    if (usedByOrder || usedByItem || usedByService || usedByCompany) {
      return res.status(409).json({
        message: "Cannot delete tax code that is in use. Remove it from all orders, items, and companies first.",
      });
    }

    await db.delete(taxCodes).where(eq(taxCodes.id, id));
    res.status(204).send();
  }
}
