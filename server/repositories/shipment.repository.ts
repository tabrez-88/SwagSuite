import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import {
  orderShipments,
  type OrderShipment,
  type InsertOrderShipment,
} from "@shared/schema";

export class ShipmentRepository {
  async getOrderShipments(orderId: string): Promise<OrderShipment[]> {
    return db
      .select()
      .from(orderShipments)
      .where(eq(orderShipments.orderId, orderId))
      .orderBy(desc(orderShipments.createdAt));
  }

  async getOrderShipment(id: string): Promise<OrderShipment | undefined> {
    const [shipment] = await db
      .select()
      .from(orderShipments)
      .where(eq(orderShipments.id, id));
    return shipment;
  }

  async createOrderShipment(shipment: InsertOrderShipment): Promise<OrderShipment> {
    const [newShipment] = await db.insert(orderShipments).values(shipment).returning();
    return newShipment;
  }

  async updateOrderShipment(id: string, shipment: Partial<InsertOrderShipment>): Promise<OrderShipment> {
    // Convert date strings to Date objects for timestamp columns
    const data: any = { ...shipment, updatedAt: new Date() };
    for (const key of ['shipDate', 'estimatedDelivery', 'actualDelivery']) {
      if (data[key] !== undefined && data[key] !== null && !(data[key] instanceof Date)) {
        data[key] = new Date(data[key]);
      }
    }
    const [updated] = await db
      .update(orderShipments)
      .set(data)
      .where(eq(orderShipments.id, id))
      .returning();
    return updated;
  }

  async deleteOrderShipment(id: string): Promise<void> {
    await db.delete(orderShipments).where(eq(orderShipments.id, id));
  }
}

export const shipmentRepository = new ShipmentRepository();
