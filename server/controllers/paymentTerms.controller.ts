import type { Request, Response } from "express";
import { db } from "../db";
import { paymentTerms } from "@shared/schema";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";

const createPaymentTermRequest = z.object({
  name: z.string().min(1, "Name is required"),
});

const updatePaymentTermRequest = createPaymentTermRequest.partial();

export class PaymentTermsController {
  static async list(_req: Request, res: Response) {
    const terms = await db.select().from(paymentTerms).orderBy(paymentTerms.name);
    res.json(terms);
  }

  static async create(req: Request, res: Response) {
    const data = createPaymentTermRequest.parse(req.body);
    // If this is the first payment term, make it default automatically
    const existing = await db.select({ id: paymentTerms.id }).from(paymentTerms).limit(1);
    const isDefault = existing.length === 0;
    const [term] = await db.insert(paymentTerms).values({ ...data, isDefault }).returning();
    res.status(201).json(term);
  }

  static async update(req: Request, res: Response) {
    const data = updatePaymentTermRequest.parse(req.body);
    const { id } = req.params;

    const [updated] = await db
      .update(paymentTerms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentTerms.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Payment term not found" });
    }
    res.json(updated);
  }

  static async setDefault(req: Request, res: Response) {
    const { id } = req.params;

    // Verify the term exists
    const [term] = await db.select().from(paymentTerms).where(eq(paymentTerms.id, id));
    if (!term) {
      return res.status(404).json({ message: "Payment term not found" });
    }

    // Clear all other defaults, then set this one
    await db.update(paymentTerms).set({ isDefault: false }).where(ne(paymentTerms.id, id));
    const [updated] = await db
      .update(paymentTerms)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(paymentTerms.id, id))
      .returning();

    res.json(updated);
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;

    // Check if payment term is in use by looking up its name first
    const [term] = await db.select().from(paymentTerms).where(eq(paymentTerms.id, id));
    if (!term) {
      return res.status(404).json({ message: "Payment term not found" });
    }

    const { companies, suppliers, orders } = await import("@shared/schema");

    const [usedByCompany] = await db.select({ id: companies.id }).from(companies).where(eq(companies.defaultTerms, term.name)).limit(1);
    const [usedBySupplier] = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.defaultTerms, term.name)).limit(1);
    const [usedByOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.paymentTerms, term.name)).limit(1);

    if (usedByCompany || usedBySupplier || usedByOrder) {
      return res.status(409).json({
        message: "Cannot delete payment term that is in use. Remove it from all companies, vendors, and orders first.",
      });
    }

    const wasDefault = term.isDefault;
    await db.delete(paymentTerms).where(eq(paymentTerms.id, id));

    // If we deleted the default, assign default to the first remaining term
    if (wasDefault) {
      const [first] = await db.select().from(paymentTerms).orderBy(paymentTerms.name).limit(1);
      if (first) {
        await db.update(paymentTerms).set({ isDefault: true }).where(eq(paymentTerms.id, first.id));
      }
    }

    res.status(204).send();
  }
}
