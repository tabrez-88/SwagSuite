import type { InsertSupplier } from "@shared/schema";
import { supplierRepository } from "../repositories/supplier.repository";

export class SupplierService {
  async getAllWithStats() {
    const { db } = await import("../db");
    const { orders, products, orderItems } = await import("@shared/schema");
    const { eq, gte, sql } = await import("drizzle-orm");

    const allSuppliers = await supplierRepository.getAll();

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Single query for all supplier YTD spending (instead of N queries)
    const ytdResults = await db
      .select({
        supplierId: orderItems.supplierId,
        total: sql<string>`COALESCE(SUM(${orderItems.quantity} * ${orderItems.unitPrice}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(gte(orders.createdAt, yearStart))
      .groupBy(orderItems.supplierId);

    const ytdMap = new Map(ytdResults.map(r => [r.supplierId, parseFloat(r.total || '0')]));

    // Single query for all supplier product counts (instead of N queries)
    const countResults = await db
      .select({
        supplierId: products.supplierId,
        count: sql<number>`COUNT(*)`,
      })
      .from(products)
      .groupBy(products.supplierId);

    const countMap = new Map(countResults.map(r => [r.supplierId, r.count || 0]));

    // Batch update suppliers whose stats changed
    const updates: Promise<void>[] = [];
    const result = allSuppliers.map((supplier) => {
      const ytdSpend = ytdMap.get(supplier.id) || 0;
      const productCount = countMap.get(supplier.id) || 0;

      const needsUpdate =
        ytdSpend !== parseFloat(supplier.ytdSpend || '0') ||
        productCount !== (supplier.productCount || 0);

      if (needsUpdate) {
        updates.push(supplierRepository.updateStats(supplier.id, ytdSpend.toFixed(2), productCount));
      }

      return { ...supplier, ytdSpend: ytdSpend.toFixed(2), productCount };
    });

    await Promise.all(updates);
    return result;
  }

  async getById(id: string) {
    return supplierRepository.getById(id);
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
