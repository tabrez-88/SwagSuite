import { shipmentRepository } from "../repositories/shipment.repository";

export class ShipmentService {
  async getByOrderId(orderId: string) {
    return shipmentRepository.getOrderShipments(orderId);
  }

  async getById(shipmentId: string) {
    return shipmentRepository.getOrderShipment(shipmentId);
  }

  async create(data: any) {
    return shipmentRepository.createOrderShipment(data);
  }

  async update(shipmentId: string, data: any) {
    return shipmentRepository.updateOrderShipment(shipmentId, data);
  }

  async delete(shipmentId: string) {
    return shipmentRepository.deleteOrderShipment(shipmentId);
  }

  /**
   * Auto-transition SO to "shipped" when a shipment is created/updated
   * with shipped, in_transit, or delivered status.
   */
  async checkShipmentAutoTransition(orderId: string, shipmentStatus: string) {
    if (!['shipped', 'in_transit', 'delivered'].includes(shipmentStatus)) return;

    try {
      const { db } = await import("../db");
      const { orders } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [currentOrder] = await db
        .select({ salesOrderStatus: orders.salesOrderStatus })
        .from(orders)
        .where(eq(orders.id, orderId));

      if (currentOrder && ['client_approved', 'in_production'].includes(currentOrder.salesOrderStatus || '')) {
        await db
          .update(orders)
          .set({ salesOrderStatus: 'shipped', updatedAt: new Date() })
          .where(eq(orders.id, orderId));

        const { projectActivities } = await import("@shared/schema");
        await db.insert(projectActivities).values({
          orderId,
          userId: 'system',
          activityType: 'system_action',
          content: `Sales Order auto-transitioned to "Shipped" — shipment marked as "${shipmentStatus}"`,
          metadata: {
            action: 'shipment_auto_transition',
            previousStatus: currentOrder.salesOrderStatus,
            newStatus: 'shipped',
          },
          isSystemGenerated: true,
        } as any);
        console.log(`[Shipment→SO Auto] Order ${orderId}: SO → shipped`);
      }
    } catch (err) {
      console.error('[Shipment→SO Auto] Error:', err);
    }
  }
}

export const shipmentService = new ShipmentService();
