import { projectRepository } from "../repositories/project.repository";

/**
 * Checks if a section is locked based on order status and unlock overrides.
 * Lock state is derived from existing status fields (no schema migration needed).
 */
export function isSectionLocked(
  order: any,
  section: 'quote' | 'salesOrder' | 'invoice',
  invoice?: any
): boolean {
  const unlocks = (order.stageData as any)?.unlocks || {};
  switch (section) {
    case 'quote': {
      const hasSalesOrder = order.orderType === 'sales_order' || order.orderType === 'rush_order' ||
        (order.salesOrderStatus && order.salesOrderStatus !== 'new');
      return hasSalesOrder && !unlocks.quote;
    }
    case 'salesOrder': {
      return order.salesOrderStatus === 'ready_to_invoice' && !unlocks.salesOrder;
    }
    case 'invoice': {
      return invoice?.status === 'paid' && !unlocks.invoice;
    }
  }
}

/**
 * Checks lock status for nested order item endpoints.
 * Returns true if locked (and sends 403 response), false if unlocked.
 */
export async function checkLockByOrderItemId(
  orderItemId: string,
  res: any
): Promise<boolean> {
  const { db } = await import("../db");
  const { orderItems } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");

  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId));
  if (!item) return false;

  if (!item.orderId) return false;
  const order = await projectRepository.getOrder(item.orderId);
  if (order && isSectionLocked(order, 'salesOrder')) {
    res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
    return true;
  }
  return false;
}
