/**
 * Helper functions for updating Year-To-Date spending calculations.
 * Used by order routes when orders are created/updated.
 */

export async function updateCompanyYtdSpending(companyId: string) {
  try {
    const { db } = await import("../db");
    const { companies, orders } = await import("@shared/schema");
    const { eq, and, gte, sql } = await import("drizzle-orm");

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const [ytdResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(
          eq(orders.companyId, companyId),
          gte(orders.createdAt, yearStart)
        )
      );

    const ytdSpend = ytdResult?.total ? parseFloat(ytdResult.total) : 0;

    await db
      .update(companies)
      .set({ ytdSpend: ytdSpend.toFixed(2) })
      .where(eq(companies.id, companyId));

    console.log(`Updated YTD spending for company ${companyId}: $${ytdSpend.toFixed(2)}`);
  } catch (error) {
    console.error(`Error updating YTD spending for company ${companyId}:`, error);
  }
}

export async function updateSupplierYtdSpending(supplierId: string) {
  try {
    const { db } = await import("../db");
    const { suppliers, orders, orderItems } = await import("@shared/schema");
    const { eq, and, gte, sql } = await import("drizzle-orm");

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const [ytdResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${orderItems.quantity} * ${orderItems.unitPrice}), 0)`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.supplierId, supplierId),
          gte(orders.createdAt, yearStart)
        )
      );

    const ytdSpend = ytdResult?.total ? parseFloat(ytdResult.total) : 0;

    await db
      .update(suppliers)
      .set({ ytdSpend: ytdSpend.toFixed(2) })
      .where(eq(suppliers.id, supplierId));

    console.log(`Updated YTD spending for supplier ${supplierId}: $${ytdSpend.toFixed(2)}`);
  } catch (error) {
    console.error(`Error updating YTD spending for supplier ${supplierId}:`, error);
  }
}
