import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders } from "./order.schema";

// ── Order Shipments ──
export const orderShipments = pgTable("order_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  carrier: varchar("carrier"),
  shippingMethod: varchar("shipping_method"),
  trackingNumber: varchar("tracking_number"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  shipDate: timestamp("ship_date"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  shipToAddress: text("ship_to_address"),
  shipToName: varchar("ship_to_name"),
  shipToCompany: varchar("ship_to_company"),
  shipToPhone: varchar("ship_to_phone"),
  status: varchar("status").default("pending"), // pending, shipped, in_transit, delivered, returned
  notes: text("notes"),
  // ShipStation integration fields
  shipstationOrderId: varchar("shipstation_order_id"),
  shipstationShipmentId: varchar("shipstation_shipment_id"),
  lastTrackingCheck: timestamp("last_tracking_check"),
  delayAlertSent: boolean("delay_alert_sent").default(false),
  lastTrackingEmailStatus: varchar("last_tracking_email_status"), // Last status that triggered a tracking email to client
  shipstationMetadata: jsonb("shipstation_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertOrderShipmentSchema = createInsertSchema(orderShipments);

// Types
export type OrderShipment = typeof orderShipments.$inferSelect;
export type InsertOrderShipment = z.infer<typeof insertOrderShipmentSchema>;
