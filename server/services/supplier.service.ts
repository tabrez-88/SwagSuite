import type { InsertSupplier } from "@shared/schema";
import { supplierRepository } from "../repositories/supplier.repository";

export class SupplierService {
  async getAllWithStats() {
    const { db } = await import("../db");
    const { orders, products, orderItems } = await import("@shared/schema");
    const { eq, and, gte, sql } = await import("drizzle-orm");

    const allSuppliers = await supplierRepository.getAll();

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    return Promise.all(
      allSuppliers.map(async (supplier) => {
        const [ytdResult] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${orderItems.quantity} * ${orderItems.unitPrice}), 0)`
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(
            and(
              eq(orderItems.supplierId, supplier.id),
              gte(orders.createdAt, yearStart)
            )
          );

        const ytdSpend = ytdResult?.total ? parseFloat(ytdResult.total) : 0;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(products)
          .where(eq(products.supplierId, supplier.id));

        const productCount = countResult?.count || 0;

        const needsUpdate =
          ytdSpend !== parseFloat(supplier.ytdSpend || '0') ||
          productCount !== (supplier.productCount || 0);

        if (needsUpdate) {
          await supplierRepository.updateStats(supplier.id, ytdSpend.toFixed(2), productCount);
        }

        return { ...supplier, ytdSpend: ytdSpend.toFixed(2), productCount };
      })
    );
  }

  async create(data: InsertSupplier) {
    return supplierRepository.create(data);
  }

  async update(id: string, data: Partial<InsertSupplier>) {
    return supplierRepository.update(id, data);
  }

  async delete(id: string) {
    return supplierRepository.delete(id);
  }
}

export const supplierService = new SupplierService();
