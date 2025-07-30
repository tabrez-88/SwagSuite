import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
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

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin, manager
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies/Customers
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default("US"),
  industry: varchar("industry"),
  notes: text("notes"),
  ytdSpend: decimal("ytd_spend", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts within companies
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  title: varchar("title"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers/Vendors
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  address: text("address"),
  contactPerson: varchar("contact_person"),
  paymentTerms: varchar("payment_terms"),
  notes: text("notes"),
  isPreferred: boolean("is_preferred").default(false),
  doNotOrder: boolean("do_not_order").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  categoryId: varchar("category_id").references(() => productCategories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  sku: varchar("sku"),
  supplierSku: varchar("supplier_sku"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  minimumQuantity: integer("minimum_quantity").default(1),
  colors: text("colors"), // JSON array of available colors
  sizes: text("sizes"), // JSON array of available sizes
  imprintMethods: text("imprint_methods"), // JSON array
  leadTime: integer("lead_time"), // days
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  notes: text("notes"),
  customerNotes: text("customer_notes"), // visible to customer
  internalNotes: text("internal_notes"), // internal only
  trackingNumber: varchar("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order line items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  color: varchar("color"),
  size: varchar("size"),
  imprintLocation: varchar("imprint_location"),
  imprintMethod: varchar("imprint_method"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artwork files
export const artworkFiles = pgTable("artwork_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  companyId: varchar("company_id").references(() => companies.id),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  filePath: varchar("file_path").notNull(),
  thumbnailPath: varchar("thumbnail_path"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: varchar("entity_type").notNull(), // order, customer, product, etc.
  entityId: varchar("entity_id").notNull(),
  action: varchar("action").notNull(), // created, updated, approved, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  activities: many(activities),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  orders: many(orders),
  artworkFiles: many(artworkFiles),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  orders: many(orders),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  company: one(companies, {
    fields: [orders.companyId],
    references: [companies.id],
  }),
  contact: one(contacts, {
    fields: [orders.contactId],
    references: [contacts.id],
  }),
  assignedUser: one(users, {
    fields: [orders.assignedUserId],
    references: [users.id],
  }),
  items: many(orderItems),
  artworkFiles: many(artworkFiles),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const artworkFilesRelations = relations(artworkFiles, ({ one }) => ({
  order: one(orders, {
    fields: [artworkFiles.orderId],
    references: [orders.id],
  }),
  company: one(companies, {
    fields: [artworkFiles.companyId],
    references: [companies.id],
  }),
  uploadedByUser: one(users, {
    fields: [artworkFiles.uploadedBy],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertArtworkFileSchema = createInsertSchema(artworkFiles).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type ArtworkFile = typeof artworkFiles.$inferSelect;
export type InsertArtworkFile = z.infer<typeof insertArtworkFileSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
