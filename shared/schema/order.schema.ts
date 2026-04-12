import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./company.schema";
import { contacts } from "./contact.schema";
import { users } from "./user.schema";
import { suppliers } from "./supplier.schema";
import { products } from "./product.schema";

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "quote",
  "pending_approval",
  "approved",
  "in_production",
  "shipped",
  "delivered",
  "cancelled"
]);

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  companyId: varchar("company_id").references(() => companies.id),
  contactId: varchar("contact_id").references(() => contacts.id),
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  csrUserId: varchar("csr_user_id").references(() => users.id), // Customer Service Representative
  status: orderStatusEnum("status").default("quote"),
  orderType: varchar("order_type").default("quote"), // quote, sales_order, rush_order
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  margin: decimal("margin", { precision: 5, scale: 2 }).default("0"), // percentage
  inHandsDate: timestamp("in_hands_date"),
  eventDate: timestamp("event_date"),
  supplierInHandsDate: timestamp("supplier_in_hands_date"),
  isFirm: boolean("is_firm").default(false),
  isRush: boolean("is_rush").default(false),
  nextActionDate: timestamp("next_action_date"),
  nextActionType: varchar("next_action_type"),
  nextActionNotes: text("next_action_notes"),
  customerPo: varchar("customer_po"),
  paymentTerms: varchar("payment_terms").default("Credit Card"),
  currency: varchar("currency").default("USD"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  defaultTaxCodeId: varchar("default_tax_code_id"), // Tax code applied to this order
  quoteIntroduction: text("quote_introduction"),
  orderDiscount: decimal("order_discount", { precision: 12, scale: 2 }).default("0"),
  projectName: varchar("project_name"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  notes: text("notes"),
  customerNotes: text("customer_notes"), // visible to customer
  internalNotes: text("internal_notes"), // internal only
  supplierNotes: text("supplier_notes"), // visible to supplier only
  additionalInformation: text("additional_information"), // general additional info
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  trackingNumber: varchar("tracking_number"),
  shippingMethod: varchar("shipping_method"),
  // Financial Integrations
  qbInvoiceId: varchar("qb_invoice_id"), // Map to QuickBooks Invoice
  stripePaymentIntentId: varchar("stripe_payment_intent_id"), // Track Stripe Charge
  taxCalculatedAt: timestamp("tax_calculated_at"), // When TaxJar last ran
  currentStage: varchar("current_stage").notNull().default("created"),
  stagesCompleted: jsonb("stages_completed").notNull().default(sql`'["created"]'::jsonb`),
  stageData: jsonb("stage_data").notNull().default(sql`'{}'::jsonb`),
  customNotes: jsonb("custom_notes").notNull().default(sql`'{}'::jsonb`),
  // Per-section status management (CommonSKU-style)
  presentationStatus: varchar("presentation_status").default("open"), // open, client_review, converted, closed
  salesOrderStatus: varchar("sales_order_status").default("new"), // new, pending_client_approval, client_change_requested, client_approved, in_production, shipped, ready_to_invoice
  quoteStatus: varchar("quote_status").default("draft"), // draft, sent, approved, rejected, expired
  enableShippingNotifications: boolean("enable_shipping_notifications").default(true),
  enableTrackingEmails: boolean("enable_tracking_emails").default(false), // Phase 2: auto tracking updates to client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order line items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  productId: varchar("product_id").references(() => products.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id), // Each product has its own vendor
  quantity: integer("quantity").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }), // Cost per unit (COGS)
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  decorationCost: decimal("decoration_cost", { precision: 10, scale: 2 }), // Decoration/imprint cost
  charges: decimal("charges", { precision: 10, scale: 2 }), // Additional charges
  sizePricing: jsonb("size_pricing"), // For SanMar/S&S: { 'XS': { cost: 10, price: 20, quantity: 5 }, 'S': {...}, ... }
  uomFactory: integer("uom_factory"), // Unit of Measure from factory (e.g., 12 pieces per box)
  color: varchar("color"),
  size: varchar("size"),
  imprintLocation: varchar("imprint_location"),
  imprintMethod: varchar("imprint_method"),
  decoratorType: varchar("decorator_type"), // 'supplier' or 'third_party'
  decoratorId: varchar("decorator_id").references(() => suppliers.id), // Third-party decorator vendor
  priceLabel: varchar("price_label"),
  personalComment: text("personal_comment"),
  description: text("description"), // Per-order-item description override (from product)
  privateNotes: text("private_notes"),
  notes: text("notes"), // Product-specific notes
  // Per-product shipping config (CommonSKU style)
  shippingDestination: varchar("shipping_destination"), // client, decorator, other_supplier, fulfillment
  shippingAccountType: varchar("shipping_account_type"), // client, supplier, ours, other
  shippingMethodOverride: varchar("shipping_method_override"), // Override order-level method
  shippingNotes: text("shipping_notes"), // Per-product shipping notes
  // Leg 1: supplier → destination (address + date)
  shipToAddressId: varchar("ship_to_address_id"), // Reference to stored address (company_addresses or supplier_addresses)
  shipToAddress: jsonb("ship_to_address"), // Snapshot: { contactName, companyName, street, street2, city, state, zipCode, country, email, phone }
  shipInHandsDate: timestamp("ship_in_hands_date"), // Per-product in-hands date
  shipFirm: boolean("ship_firm").default(false), // Firm date flag
  shippingQuote: decimal("shipping_quote", { precision: 10, scale: 2 }), // Shipping cost quote
  // Leg 2: decorator → client (only when shippingDestination = "decorator")
  leg2ShipTo: varchar("leg2_ship_to"), // Destination type for leg 2 (usually "client")
  leg2AddressId: varchar("leg2_address_id"), // Stored address reference
  leg2Address: jsonb("leg2_address"), // Address snapshot
  leg2InHandsDate: timestamp("leg2_in_hands_date"),
  leg2Firm: boolean("leg2_firm").default(false),
  leg2ShippingMethod: varchar("leg2_shipping_method"),
  leg2ShippingAccountType: varchar("leg2_shipping_account_type"),
  leg2ShippingQuote: decimal("leg2_shipping_quote", { precision: 10, scale: 2 }),
  taxCodeId: varchar("tax_code_id"), // Per-item tax code override
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Order Item Lines (per-size/color line items under each order item) ──
export const orderItemLines = pgTable("order_item_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  size: varchar("size"),
  color: varchar("color"),
  quantity: integer("quantity").notNull().default(0),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  margin: decimal("margin", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Order Additional Charges (per-item setup fees, rush charges, etc.) ──
export const orderAdditionalCharges = pgTable("order_additional_charges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  description: varchar("description").notNull(),
  chargeType: varchar("charge_type").default("flat"), // flat, percentage
  chargeCategory: varchar("charge_category").default("fixed"), // run (per unit) or fixed (one-time)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Legacy: treated as retailPrice
  netCost: decimal("net_cost", { precision: 10, scale: 4 }).default("0"), // Vendor cost per unit
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }), // Client price per unit (overrides amount when set)
  margin: decimal("margin", { precision: 5, scale: 2 }), // Margin % between netCost and retailPrice
  quantity: integer("quantity").default(1), // For fixed charges (run charges use item qty)
  isVendorCharge: boolean("is_vendor_charge").default(false),
  displayToClient: boolean("display_to_client").default(true),
  displayToVendor: boolean("display_to_vendor").default(true), // Show on vendor PO PDF (CommonSKU pattern)
  includeInUnitPrice: boolean("include_in_unit_price").default(false), // Run: "Include in price", Fixed: "Subtract from margin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Order Service Charges (order-level: Freight, Fulfillment, Shipping, Other, Custom) ──
export const orderServiceCharges = pgTable("order_service_charges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  chargeType: varchar("charge_type").notNull(), // freight, fulfillment, shipping, rush_fee, other, custom
  description: varchar("description").notNull(),
  quantity: integer("quantity").default(1),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull().default("0"), // What we pay
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0"), // What client pays
  taxable: boolean("taxable").default(false),
  taxCodeId: varchar("tax_code_id"), // Per-service-charge tax code override
  includeInMargin: boolean("include_in_margin").default(false), // Include in margin calculation?
  displayToClient: boolean("display_to_client").default(true),
  displayToVendor: boolean("display_to_vendor").default(true), // Show on vendor PO PDF (CommonSKU pattern, filtered by vendorId match)
  vendorId: varchar("vendor_id").references(() => suppliers.id), // Optional vendor link
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  orderNumber: z.string().optional(),
});

const baseOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = z.preprocess(
  (input: any) => {
    // Transform numeric price fields to strings for decimal type compatibility
    if (input && typeof input === 'object') {
      return {
        ...input,
        cost: input.cost != null ? String(input.cost) : input.cost,
        unitPrice: input.unitPrice != null ? String(input.unitPrice) : input.unitPrice,
        totalPrice: input.totalPrice != null ? String(input.totalPrice) : input.totalPrice,
        decorationCost: input.decorationCost != null ? String(input.decorationCost) : input.decorationCost,
        charges: input.charges != null ? String(input.charges) : input.charges,
      };
    }
    return input;
  },
  baseOrderItemSchema
);

export const insertOrderItemLineSchema = createInsertSchema(orderItemLines);
export const insertOrderAdditionalChargeSchema = createInsertSchema(orderAdditionalCharges);
export const insertOrderServiceChargeSchema = createInsertSchema(orderServiceCharges);

// Types
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItemLine = typeof orderItemLines.$inferSelect;
export type InsertOrderItemLine = z.infer<typeof insertOrderItemLineSchema>;
export type OrderAdditionalCharge = typeof orderAdditionalCharges.$inferSelect;
export type InsertOrderAdditionalCharge = z.infer<typeof insertOrderAdditionalChargeSchema>;
export type OrderServiceCharge = typeof orderServiceCharges.$inferSelect;
export type InsertOrderServiceCharge = z.infer<typeof insertOrderServiceChargeSchema>;
