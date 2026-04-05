import type { Request, Response } from "express";
import { db } from "../db";
import { paymentTerms } from "@shared/schema";
import { eq } from "drizzle-orm";
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
    const [term] = await db.insert(paymentTerms).values(data).returning();
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

    await db.delete(paymentTerms).where(eq(paymentTerms.id, id));
    res.status(204).send();
  }
}
