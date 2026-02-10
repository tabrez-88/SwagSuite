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
  serial,
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
  username: varchar("username").unique(),
  password: varchar("password"), // bcrypt hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin, manager
  authProvider: varchar("auth_provider").default("local"), // local, replit, google, etc
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  emailReportsEnabled: boolean("email_reports_enabled").default(true),
  lastEmailReportSent: timestamp("last_email_report_sent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User invitations table
export const userInvitations = pgTable("user_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  role: varchar("role").notNull().default("user"),
  token: varchar("token").notNull().unique(),
  invitedBy: varchar("invited_by").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
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
  // HubSpot integration fields
  hubspotId: varchar("hubspot_id"),
  hubspotSyncedAt: timestamp("hubspot_synced_at"),
  // Social media integration
  socialMediaLinks: jsonb("social_media_links"), // { linkedin: "url", twitter: "url", facebook: "url" }
  socialMediaPosts: jsonb("social_media_posts"), // Array of recent posts with content and timestamps
  lastSocialMediaSync: timestamp("last_social_media_sync"),
  // AI-powered insights
  lastNewsUpdate: timestamp("last_news_update"),
  newsAlerts: jsonb("news_alerts"),
  excitingNewsFlags: jsonb("exciting_news_flags"), // Array of flagged posts containing "exciting news"
  // Customer scoring and analytics
  customerScore: integer("customer_score").default(0),
  engagementLevel: varchar("engagement_level"), // high, medium, low
  // Additional addresses for multiple locations
  shippingAddresses: jsonb("shipping_addresses"),
  billingAddress: jsonb("billing_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts within companies and suppliers
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  title: varchar("title"),
  isPrimary: boolean("is_primary").default(false),
  receiveOrderEmails: boolean("receive_order_emails").default(true), // Whether this contact receives order communication emails
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dedicated clients table for CRM
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  title: varchar("title"),
  industry: varchar("industry"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  website: varchar("website"),
  preferredContact: varchar("preferred_contact").notNull(),
  clientType: varchar("client_type").notNull(),
  status: varchar("status").notNull().default("active"),
  notes: text("notes"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  accountManager: varchar("account_manager"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  paymentTerms: varchar("payment_terms"),
  // Social media integration
  socialMediaLinks: jsonb("social_media_links"), // { linkedin: "url", twitter: "url", facebook: "url", instagram: "url", other: "url" }
  socialMediaPosts: jsonb("social_media_posts"), // Array of recent posts with content, timestamps, and platform
  lastSocialMediaSync: timestamp("last_social_media_sync"),
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
  // Enhanced vendor management
  ytdSpend: decimal("ytd_spend", { precision: 12, scale: 2 }).default("0"),
  lastYearSpend: decimal("last_year_spend", { precision: 12, scale: 2 }).default("0"),
  productCount: integer("product_count").default(0),
  preferredBenefits: jsonb("preferred_benefits"), // EQP, rebates, self-promos, etc.
  vendorOffers: jsonb("vendor_offers"), // Current offers and programs
  autoNotifications: boolean("auto_notifications").default(true),
  lastOrderDate: timestamp("last_order_date"),
  orderConfirmationReminder: boolean("order_confirmation_reminder").default(true),
  // ESP/ASI/SAGE integration
  espId: varchar("esp_id"),
  asiId: varchar("asi_id"),
  sageId: varchar("sage_id"),
  distributorCentralId: varchar("distributor_central_id"),
  apiIntegrationStatus: varchar("api_integration_status"), // active, inactive, error
  lastSyncAt: timestamp("last_sync_at"),
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
  brand: varchar("brand"),
  category: varchar("category"),
  colors: text("colors").array(), // Array of available colors
  sizes: text("sizes").array(), // Array of available sizes
  imprintMethods: text("imprint_methods"), // JSON array
  leadTime: integer("lead_time"), // days
  imageUrl: varchar("image_url"),
  productType: varchar("product_type").default("apparel"), // apparel, hard_goods, promotional
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
  csrUserId: varchar("csr_user_id").references(() => users.id), // Customer Service Representative
  productionManagerId: varchar("production_manager_id").references(() => users.id), // Production Manager
  // Note: supplierId removed - vendors are now tracked at order_items level
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
  nextActionNotes: text("next_action_notes"),
  customerPo: varchar("customer_po"),
  paymentTerms: varchar("payment_terms").default("Net 30"),
  orderDiscount: decimal("order_discount", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  customerNotes: text("customer_notes"), // visible to customer
  internalNotes: text("internal_notes"), // internal only
  supplierNotes: text("supplier_notes"), // visible to supplier only
  additionalInformation: text("additional_information"), // general additional info
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  trackingNumber: varchar("tracking_number"),
  shippingMethod: varchar("shipping_method"),
  currentStage: varchar("current_stage").notNull().default("sales-booked"),
  stagesCompleted: jsonb("stages_completed").notNull().default(sql`'["sales-booked"]'::jsonb`),
  stageData: jsonb("stage_data").notNull().default(sql`'{}'::jsonb`),
  customNotes: jsonb("custom_notes").notNull().default(sql`'{}'::jsonb`),
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
  notes: text("notes"), // Product-specific notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Artwork items per order item
export const artworkItems = pgTable("artwork_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").references(() => orderItems.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  artworkType: varchar("artwork_type", { length: 100 }), // embroidery, screen-print, heat-transfer, etc.
  location: varchar("location", { length: 255 }), // e.g., "Front - Centered"
  color: varchar("color", { length: 100 }), // e.g., "White", "PMS 186"
  size: varchar("size", { length: 100 }), // e.g., "3\" x 3\""
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, in-review, approved, rejected, revision-needed
  fileName: varchar("file_name", { length: 500 }),
  filePath: varchar("file_path", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Note: Vendors are now managed at order_item level (each product has its own vendor)
// This follows the Antera Software pattern where vendors are product-specific

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

// Order files (artwork proofs, documents, etc.)
export const orderFiles = pgTable("order_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  orderItemId: varchar("order_item_id").references(() => orderItems.id), // Optional: associate file with specific product
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  filePath: varchar("file_path").notNull(),
  thumbnailPath: varchar("thumbnail_path"),
  fileType: varchar("file_type").notNull().default("document"), // customer_proof, supplier_proof, invoice, other_document, artwork
  tags: jsonb("tags").default(sql`'[]'::jsonb`), // Array of tags like ["customer_proof", "final_artwork"]
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artwork approvals
export const artworkApprovals = pgTable("artwork_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  orderItemId: varchar("order_item_id").references(() => orderItems.id),
  artworkFileId: varchar("artwork_file_id").references(() => artworkFiles.id),
  approvalToken: varchar("approval_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, declined
  clientEmail: varchar("client_email", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  pdfPath: varchar("pdf_path", { length: 500 }),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote approvals - for customer approval of quotes/sales orders
export const quoteApprovals = pgTable("quote_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  documentId: varchar("document_id"), // Reference to generated document
  approvalToken: varchar("approval_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, declined
  clientEmail: varchar("client_email", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  quoteTotal: decimal("quote_total", { precision: 12, scale: 2 }),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"), // When client first viewed the quote
  approvedAt: timestamp("approved_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  approvalNotes: text("approval_notes"), // Client can add notes when approving
  pdfPath: varchar("pdf_path", { length: 500 }),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Data Upload/Import storage
export const dataUploads = pgTable("data_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  filePath: varchar("file_path").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  processedData: jsonb("processed_data"), // AI-analyzed data
  createdRecords: jsonb("created_records"), // IDs of created clients/orders
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Vendor Approval Requests (for Do Not Order vendors)
export const vendorApprovalRequests = pgTable("vendor_approval_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  productId: varchar("product_id").references(() => products.id),
  orderId: varchar("order_id").references(() => orders.id),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  reason: text("reason"), // Why the salesperson wants to use this vendor
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly Email Report Configuration
export const weeklyReportConfig = pgTable("weekly_report_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  dataSource: varchar("data_source").notNull(), // 'orders', 'revenue', 'margin', 'stores', 'custom'
  calculationMethod: varchar("calculation_method").notNull(), // 'count', 'sum', 'average', 'percentage'
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly Email Report Logs
export const weeklyReportLogs = pgTable("weekly_report_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  reportWeekStart: timestamp("report_week_start").notNull(),
  reportWeekEnd: timestamp("report_week_end").notNull(),
  metricsData: jsonb("metrics_data").notNull(), // Store calculated metrics
  emailSentAt: timestamp("email_sent_at"),
  emailStatus: varchar("email_status").default("pending"), // pending, sent, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  activities: many(activities),
  emailSettings: many(userEmailSettings),
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
  supplier: one(suppliers, {
    fields: [contacts.supplierId],
    references: [suppliers.id],
  }),
  orders: many(orders),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  contacts: many(contacts),
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
  errors: many(errors),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  artworkItems: many(artworkItems),
}));

export const artworkItemsRelations = relations(artworkItems, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [artworkItems.orderItemId],
    references: [orderItems.id],
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

export const insertCompanySchema = createInsertSchema(companies).extend({
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  otherSocialUrl: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  totalOrders: true,
  totalSpent: true,
  lastOrderDate: true,
  lastSocialMediaSync: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorApprovalRequestSchema = createInsertSchema(vendorApprovalRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

export const insertArtworkFileSchema = createInsertSchema(artworkFiles).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertDataUploadSchema = createInsertSchema(dataUploads).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertWeeklyReportConfigSchema = createInsertSchema(weeklyReportConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyReportLogSchema = createInsertSchema(weeklyReportLogs).omit({
  id: true,
  createdAt: true,
});





// Types
// AI Knowledge Base
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category"), // procedures, policies, training, etc.
  tags: jsonb("tags"),
  accessLevel: varchar("access_level").default("all"), // all, admin, department-specific
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  searchVector: text("search_vector"), // For full-text search
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Sequences (HubSpot-style automation)
export const marketingSequences = pgTable("marketing_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  targetAudience: varchar("target_audience"), // new_customers, existing_customers, etc.
  isActive: boolean("is_active").default(true),
  steps: jsonb("steps"), // Array of sequence steps with delays and content
  aiGenerated: boolean("ai_generated").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Automation Tasks and AI Drafts
export const automationTasks = pgTable("automation_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskType: varchar("task_type").notNull(), // vendor_followup, customer_outreach, etc.
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  status: varchar("status").default("pending"), // pending, approved, sent, cancelled
  aiDraftContent: text("ai_draft_content"),
  scheduledFor: timestamp("scheduled_for"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  metadata: jsonb("metadata"), // Context data for the task
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Integration Sync Logs
export const integrationSyncs = pgTable("integration_syncs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationType: varchar("integration_type").notNull(), // hubspot, slack, esp, asi, sage
  syncType: varchar("sync_type").notNull(), // full, incremental, manual
  status: varchar("status").notNull(), // success, error, in_progress
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// News and Media Tracking (AI-powered)
export const newsTracking = pgTable("news_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // company, supplier, industry
  entityId: varchar("entity_id"),
  headline: varchar("headline").notNull(),
  summary: text("summary"),
  sourceUrl: varchar("source_url"),
  sentiment: varchar("sentiment"), // positive, negative, neutral
  relevanceScore: integer("relevance_score"), // 1-10
  alertsSent: boolean("alerts_sent").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Error types and resolution enums
export const errorTypeEnum = pgEnum("error_type", [
  "pricing",
  "in_hands_date",
  "shipping",
  "printing",
  "artwork_proofing",
  "oos", // out of stock
  "other"
]);

export const responsiblePartyEnum = pgEnum("responsible_party", [
  "customer",
  "vendor",
  "lsd" // Liquid Screen Design
]);

export const resolutionTypeEnum = pgEnum("resolution_type", [
  "refund",
  "credit_for_future_order",
  "reprint",
  "courier_shipping",
  "other"
]);

// Errors tracking table
export const errors = pgTable("errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  date: timestamp("date").notNull().defaultNow(),
  projectNumber: varchar("project_number"), // Could be different from order number
  errorType: errorTypeEnum("error_type").notNull(),
  clientName: varchar("client_name").notNull(),
  vendorName: varchar("vendor_name"),
  responsibleParty: responsiblePartyEnum("responsible_party").notNull(),
  resolution: resolutionTypeEnum("resolution").notNull(),
  costToLsd: decimal("cost_to_lsd", { precision: 12, scale: 2 }).default("0"),
  productionRep: varchar("production_rep"),
  orderRep: varchar("order_rep"),
  clientRep: varchar("client_rep"),
  additionalNotes: text("additional_notes"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const errorsRelations = relations(errors, ({ one }) => ({
  order: one(orders, {
    fields: [errors.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [errors.createdBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [errors.resolvedBy],
    references: [users.id],
  }),
}));

export const insertErrorSchema = createInsertSchema(errors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

// Integration Settings table
export const integrationSettings = pgTable("integration_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // S&S Activewear Integration
  ssActivewearAccount: varchar("ss_activewear_account"),
  ssActivewearApiKey: text("ss_activewear_api_key"),
  // SanMar Integration (SOAP API)
  sanmarCustomerId: varchar("sanmar_customer_id"),
  sanmarUsername: varchar("sanmar_username"),
  sanmarPassword: text("sanmar_password"),
  // Slack Integration
  slackBotToken: text("slack_bot_token"),
  slackChannelId: varchar("slack_channel_id"),
  // HubSpot Integration
  hubspotApiKey: text("hubspot_api_key"),
  // SAGE Integration
  sageAcctId: varchar("sage_acct_id"),
  sageLoginId: varchar("sage_login_id"),
  sageApiKey: text("sage_api_key"),
  // Mapbox Geocoding Integration (Address Autocomplete)
  mapboxAccessToken: text("mapbox_access_token"),
  // Email Integration
  emailProvider: varchar("email_provider"),
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: text("smtp_password"),
  emailFromAddress: varchar("email_from_address"),
  emailFromName: varchar("email_from_name"),
  emailReplyTo: varchar("email_reply_to"),
  // Connection status flags
  quickbooksConnected: boolean("quickbooks_connected").default(false),
  stripeConnected: boolean("stripe_connected").default(false),
  shipmateConnected: boolean("shipmate_connected").default(false),
  // Metadata
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationSettingsRelations = relations(integrationSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [integrationSettings.updatedBy],
    references: [users.id],
  }),
}));

export const insertIntegrationSettingsSchema = createInsertSchema(integrationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Per-user email credentials (SMTP + IMAP)
export const userEmailSettings = pgTable("user_email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // SMTP Settings
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: text("smtp_password"),
  // IMAP Settings
  imapHost: varchar("imap_host"),
  imapPort: integer("imap_port"),
  imapUser: varchar("imap_user"),
  imapPassword: text("imap_password"),
  // Preferences
  isPrimary: boolean("is_primary").default(false),
  useDefaultForCompose: boolean("use_default_for_compose").default(false),
  hideNameOnSend: boolean("hide_name_on_send").default(false),
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userEmailSettingsRelations = relations(userEmailSettings, ({ one }) => ({
  user: one(users, {
    fields: [userEmailSettings.userId],
    references: [users.id],
  }),
}));

export const insertUserEmailSettingsSchema = createInsertSchema(userEmailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// System Branding and Theme Settings
export const systemBranding = pgTable("system_branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Logo settings
  logoUrl: text("logo_url"),
  logoSize: varchar("logo_size").default("medium"), // small, medium, large
  logoPosition: varchar("logo_position").default("left"), // left, center, right
  faviconUrl: text("favicon_url"),
  // Company branding
  companyName: varchar("company_name"),
  tagline: text("tagline"),
  // Theme colors
  primaryColor: varchar("primary_color").default("#3b82f6"),
  secondaryColor: varchar("secondary_color").default("#64748b"),
  accentColor: varchar("accent_color").default("#10b981"),
  backgroundColor: varchar("background_color").default("#ffffff"),
  textColor: varchar("text_color").default("#1f2937"),
  // Sidebar colors
  sidebarBackgroundColor: varchar("sidebar_background_color").default("#014559"),
  sidebarTextColor: varchar("sidebar_text_color").default("#ffffff"),
  sidebarBorderColor: varchar("sidebar_border_color").default("#374151"),
  // Navigation colors
  navHoverColor: varchar("nav_hover_color").default("#374151"),
  navActiveColor: varchar("nav_active_color").default("#3b82f6"),
  navTextColor: varchar("nav_text_color").default("#d1d5db"),
  navTextActiveColor: varchar("nav_text_active_color").default("#ffffff"),
  // Border and UI colors
  borderColor: varchar("border_color").default("#e5e7eb"),
  // Additional theme settings
  borderRadius: varchar("border_radius").default("medium"), // none, small, medium, large
  fontFamily: varchar("font_family").default("inter"), // inter, roboto, opensans, etc.
  // Metadata
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemBrandingRelations = relations(systemBranding, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemBranding.updatedBy],
    references: [users.id],
  }),
}));

export const insertSystemBrandingSchema = createInsertSchema(systemBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// KPI Tracking
export const kpiMetrics = pgTable("kpi_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  metricType: varchar("metric_type").notNull(), // revenue, orders, contacts, errors, etc.
  period: varchar("period").notNull(), // daily, weekly, monthly, yearly
  periodDate: timestamp("period_date").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  target: decimal("target", { precision: 12, scale: 2 }),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Slack Integration Messages
export const slackMessages = pgTable("slack_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  messageId: varchar("message_id").notNull(),
  userId: varchar("user_id"),
  content: text("content"),
  attachments: jsonb("attachments"),
  threadTs: varchar("thread_ts"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Report Templates (AI-generated and saved)
export const reportTemplates = pgTable("report_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  query: text("query").notNull(), // Natural language or SQL query
  parameters: jsonb("parameters"), // Dynamic parameters for the report
  schedule: varchar("schedule"), // cron-like schedule for automated reports
  recipients: jsonb("recipients"), // Email addresses for scheduled reports
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ESP/ASI/SAGE Promotional Products Integration Tables
export const espProducts = pgTable("esp_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asiNumber: varchar("asi_number").notNull(),
  productName: varchar("product_name").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  supplierAsiNumber: varchar("supplier_asi_number"),
  category: varchar("category"),
  subCategory: varchar("sub_category"),
  description: text("description"),
  longDescription: text("long_description"),
  specifications: jsonb("specifications"),
  pricingCode: varchar("pricing_code"), // ESP pricing codes
  basePricing: jsonb("base_pricing"),
  decorationPricing: jsonb("decoration_pricing"),
  minimumQuantity: integer("minimum_quantity"),
  productionTime: varchar("production_time"),
  rushService: boolean("rush_service").default(false),
  decorationMethods: text("decoration_methods").array(),
  colors: text("colors").array(),
  sizes: text("sizes").array(),
  imageUrls: text("image_urls").array(),
  espProductId: varchar("esp_product_id").unique(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  syncStatus: varchar("sync_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sageProducts = pgTable("sage_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sageId: varchar("sage_id").notNull().unique(),
  productName: varchar("product_name").notNull(),
  productNumber: varchar("product_number"),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  brand: varchar("brand"),
  description: text("description"),
  features: text("features").array(),
  materials: text("materials").array(),
  dimensions: varchar("dimensions"),
  weight: decimal("weight", { precision: 10, scale: 4 }),
  eqpLevel: varchar("eqp_level"), // SAGE EQP rating
  pricingStructure: jsonb("pricing_structure"),
  quantityBreaks: jsonb("quantity_breaks"),
  setupCharges: jsonb("setup_charges"),
  decorationMethods: text("decoration_methods").array(),
  leadTimes: jsonb("lead_times"),
  imageGallery: text("image_gallery").array(),
  technicalDrawings: text("technical_drawings").array(),
  complianceCertifications: text("compliance_certifications").array(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  syncStatus: varchar("sync_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const distributorCentralProducts = pgTable("distributor_central_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dcProductId: varchar("dc_product_id").notNull().unique(),
  productName: varchar("product_name").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  description: text("description"),
  keyFeatures: text("key_features").array(),
  decorationAreas: jsonb("decoration_areas"),
  imprintMethods: text("imprint_methods").array(),
  colors: text("available_colors").array(),
  sizes: text("available_sizes").array(),
  pricing: jsonb("pricing"),
  quantityPricing: jsonb("quantity_pricing"),
  minimumOrder: integer("minimum_order"),
  rushOptions: jsonb("rush_options"),
  productImages: text("product_images").array(),
  compliance: text("compliance").array(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  syncStatus: varchar("sync_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unified product search index for cross-platform searching
export const productSearchIndex = pgTable("product_search_index", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystem: varchar("source_system").notNull(), // 'esp', 'sage', 'dc', 'internal'
  sourceProductId: varchar("source_product_id").notNull(),
  productName: varchar("product_name").notNull(),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  supplierId: varchar("supplier_id"),
  supplierName: varchar("supplier_name"),
  asiNumber: varchar("asi_number"),
  description: text("description"),
  keyTerms: text("key_terms").array(),
  minPrice: decimal("min_price"),
  maxPrice: decimal("max_price"),
  minQuantity: integer("min_quantity"),
  decorationMethods: text("decoration_methods").array(),
  colors: text("colors").array(),
  primaryImage: varchar("primary_image"),
  qualityScore: decimal("quality_score"),
  popularityScore: integer("popularity_score").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  searchRank: integer("search_rank").default(0),
  isActive: boolean("is_active").default(true),
});

// Integration configurations and API management
export const integrationConfigurations = pgTable("integration_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integration: varchar("integration").notNull().unique(), // 'esp', 'sage', 'dc'
  displayName: varchar("display_name").notNull(),
  apiEndpoint: varchar("api_endpoint"),
  apiVersion: varchar("api_version"),
  syncEnabled: boolean("sync_enabled").default(false),
  syncFrequency: varchar("sync_frequency").default('daily'),
  categoryFilters: text("category_filters").array(),
  supplierFilters: text("supplier_filters").array(),
  priceRangeMin: decimal("price_range_min"),
  priceRangeMax: decimal("price_range_max"),
  maxApiCallsPerHour: integer("max_api_calls_per_hour").default(1000),
  isHealthy: boolean("is_healthy").default(true),
  lastHealthCheck: timestamp("last_health_check"),
  totalSyncs: integer("total_syncs").default(0),
  totalRecordsSynced: integer("total_records_synced").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = typeof userInvitations.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;
export type UserEmailSettings = typeof userEmailSettings.$inferSelect;
export type InsertUserEmailSettings = z.infer<typeof insertUserEmailSettingsSchema>;

// Sequence Builder Tables
export const sequences = pgTable("sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, active, paused, archived
  totalSteps: integer("total_steps").notNull().default(0),
  automation: integer("automation").notNull().default(100), // percentage of automation
  unenrollCriteria: text("unenroll_criteria"), // JSON array of criteria
  settings: text("settings"), // JSON settings object
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sequenceSteps = pgTable("sequence_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // email, task, call, linkedin_message
  position: integer("position").notNull(),
  title: varchar("title").notNull(),
  content: text("content"), // Email content or task description
  delayDays: integer("delay_days").notNull().default(1),
  delayHours: integer("delay_hours").notNull().default(0),
  delayMinutes: integer("delay_minutes").notNull().default(0),
  settings: text("settings"), // JSON settings for the step
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
  contactId: varchar("contact_id").notNull(), // Can reference companies or leads
  contactType: varchar("contact_type").notNull(), // company, lead
  status: varchar("status").notNull().default("active"), // active, paused, completed, unenrolled
  currentStep: integer("current_step").notNull().default(1),
  enrolledBy: varchar("enrolled_by").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  unenrolledAt: timestamp("unenrolled_at"),
  unenrollReason: varchar("unenroll_reason"),
});

export const sequenceStepExecutions = pgTable("sequence_step_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull().references(() => sequenceEnrollments.id, { onDelete: "cascade" }),
  stepId: varchar("step_id").notNull().references(() => sequenceSteps.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("pending"), // pending, sent, opened, clicked, replied, failed, skipped
  scheduledAt: timestamp("scheduled_at"),
  executedAt: timestamp("executed_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  repliedAt: timestamp("replied_at"),
  bounced: boolean("bounced").default(false),
  metadata: text("metadata"), // JSON metadata for tracking
});

export const sequenceTemplates = pgTable("sequence_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // new_client, existing_client, general
  industryType: varchar("industry_type"), // promotional_products, general
  steps: text("steps").notNull(), // JSON array of step templates
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sequenceAnalytics = pgTable("sequence_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(),
  totalEnrollments: integer("total_enrollments").default(0),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalReplied: integer("total_replied").default(0),
  totalBounced: integer("total_bounced").default(0),
  totalMeetingsBooked: integer("total_meetings_booked").default(0),
  totalDealsCreated: integer("total_deals_created").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
});

// Relations
export const sequencesRelations = relations(sequences, ({ many }) => ({
  steps: many(sequenceSteps),
  enrollments: many(sequenceEnrollments),
  analytics: many(sequenceAnalytics),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one, many }) => ({
  sequence: one(sequences, {
    fields: [sequenceSteps.sequenceId],
    references: [sequences.id],
  }),
  executions: many(sequenceStepExecutions),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({ one, many }) => ({
  sequence: one(sequences, {
    fields: [sequenceEnrollments.sequenceId],
    references: [sequences.id],
  }),
  executions: many(sequenceStepExecutions),
}));

export const sequenceStepExecutionsRelations = relations(sequenceStepExecutions, ({ one }) => ({
  enrollment: one(sequenceEnrollments, {
    fields: [sequenceStepExecutions.enrollmentId],
    references: [sequenceEnrollments.id],
  }),
  step: one(sequenceSteps, {
    fields: [sequenceStepExecutions.stepId],
    references: [sequenceSteps.id],
  }),
}));

export const sequenceAnalyticsRelations = relations(sequenceAnalytics, ({ one }) => ({
  sequence: one(sequences, {
    fields: [sequenceAnalytics.sequenceId],
    references: [sequences.id],
  }),
}));

// Types
export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = typeof sequences.$inferInsert;
export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type InsertSequenceStep = typeof sequenceSteps.$inferInsert;
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
export type InsertSequenceEnrollment = typeof sequenceEnrollments.$inferInsert;
export type SequenceStepExecution = typeof sequenceStepExecutions.$inferSelect;
export type InsertSequenceStepExecution = typeof sequenceStepExecutions.$inferInsert;
export type SequenceTemplate = typeof sequenceTemplates.$inferSelect;
export type InsertSequenceTemplate = typeof sequenceTemplates.$inferInsert;
export type SequenceAnalytics = typeof sequenceAnalytics.$inferSelect;
export type InsertSequenceAnalytics = typeof sequenceAnalytics.$inferInsert;

// Drizzle Zod schemas for validation
export const insertSequenceSchema = createInsertSchema(sequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceStepSchema = createInsertSchema(sequenceSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceEnrollmentSchema = createInsertSchema(sequenceEnrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});

export const insertSequenceAnalyticsSchema = createInsertSchema(sequenceAnalytics).omit({
  id: true,
});

// AI Presentation Builder tables
export const presentations = pgTable("presentations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  dealNotes: text("deal_notes"),
  hubspotDealId: varchar("hubspot_deal_id"),
  suggestedProducts: jsonb("suggested_products").default(sql`'[]'::jsonb`),
  slides: jsonb("slides").default(sql`'[]'::jsonb`),
  status: varchar("status").default("draft"), // draft, generating, completed
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const presentationFiles = pgTable("presentation_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  presentationId: varchar("presentation_id").notNull().references(() => presentations.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size"),
  filePath: varchar("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const presentationProducts = pgTable("presentation_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  presentationId: varchar("presentation_id").notNull().references(() => presentations.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id),
  productName: varchar("product_name").notNull(),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }),
  suggestedQuantity: integer("suggested_quantity"),
  reasoning: text("reasoning"),
  isIncluded: boolean("is_included").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Presentation = typeof presentations.$inferSelect;
export type InsertPresentation = typeof presentations.$inferInsert;
export type PresentationFile = typeof presentationFiles.$inferSelect;
export type InsertPresentationFile = typeof presentationFiles.$inferInsert;
export type PresentationProduct = typeof presentationProducts.$inferSelect;
export type InsertPresentationProduct = typeof presentationProducts.$inferInsert;

// Slack Message Types
export type SlackMessage = typeof slackMessages.$inferSelect;
export type InsertSlackMessage = typeof slackMessages.$inferInsert;

// S&S Activewear Integration
export const ssActivewearProducts = pgTable("ss_activewear_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku").notNull().unique(),
  gtin: varchar("gtin"),
  styleId: integer("style_id"),
  brandName: varchar("brand_name"),
  styleName: varchar("style_name"),
  colorName: varchar("color_name"),
  colorCode: varchar("color_code"),
  sizeName: varchar("size_name"),
  sizeCode: varchar("size_code"),
  unitWeight: decimal("unit_weight", { precision: 10, scale: 4 }),
  caseQty: integer("case_qty"),
  piecePrice: decimal("piece_price", { precision: 10, scale: 2 }),
  dozenPrice: decimal("dozen_price", { precision: 10, scale: 2 }),
  casePrice: decimal("case_price", { precision: 10, scale: 2 }),
  customerPrice: decimal("customer_price", { precision: 10, scale: 2 }),
  qty: integer("qty").default(0),
  colorFrontImage: varchar("color_front_image"),
  colorBackImage: varchar("color_back_image"),
  colorSideImage: varchar("color_side_image"),
  colorSwatchImage: varchar("color_swatch_image"),
  countryOfOrigin: varchar("country_of_origin"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ssActivewearImportJobs = pgTable("ss_activewear_import_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, running, completed, failed
  totalProducts: integer("total_products").default(0),
  processedProducts: integer("processed_products").default(0),
  newProducts: integer("new_products").default(0),
  updatedProducts: integer("updated_products").default(0),
  errorCount: integer("error_count").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SsActivewearProduct = typeof ssActivewearProducts.$inferSelect;
export type InsertSsActivewearProduct = typeof ssActivewearProducts.$inferInsert;
export type SsActivewearImportJob = typeof ssActivewearImportJobs.$inferSelect;
export type InsertSsActivewearImportJob = typeof ssActivewearImportJobs.$inferInsert;

// Artwork management tables for Kanban-style workflow
export const artworkColumns = pgTable("artwork_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  position: integer("position").notNull(),
  color: varchar("color").notNull().default("#6B7280"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const artworkCards = pgTable("artwork_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  columnId: varchar("column_id").notNull().references(() => artworkColumns.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  assignedUserId: varchar("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  position: integer("position").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  dueDate: timestamp("due_date"),
  labels: jsonb("labels").default(sql`'[]'::jsonb`),
  attachments: jsonb("attachments").default(sql`'[]'::jsonb`),
  checklist: jsonb("checklist").default(sql`'[]'::jsonb`),
  comments: jsonb("comments").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ArtworkColumn = typeof artworkColumns.$inferSelect;
export type InsertArtworkColumn = typeof artworkColumns.$inferInsert;
export type ArtworkCard = typeof artworkCards.$inferSelect;
export type InsertArtworkCard = typeof artworkCards.$inferInsert;

// Artwork insert schemas
export const insertArtworkColumnSchema = createInsertSchema(artworkColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtworkCardSchema = createInsertSchema(artworkCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Artwork relations
export const artworkColumnsRelations = relations(artworkColumns, ({ many }) => ({
  cards: many(artworkCards),
}));

export const artworkCardsRelations = relations(artworkCards, ({ one }) => ({
  column: one(artworkColumns, {
    fields: [artworkCards.columnId],
    references: [artworkColumns.id],
  }),
  order: one(orders, {
    fields: [artworkCards.orderId],
    references: [orders.id],
  }),
  company: one(companies, {
    fields: [artworkCards.companyId],
    references: [companies.id],
  }),
  assignedUser: one(users, {
    fields: [artworkCards.assignedUserId],
    references: [users.id],
  }),
}));

// Production stages table for customizable workflow stages
export const productionStages = pgTable("production_stages", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: varchar("description"),
  order: integer("order").notNull(),
  color: varchar("color").notNull().default("bg-gray-100 text-gray-800"),
  icon: varchar("icon").notNull().default("Package"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production tracking table for orders in production
export const productionTracking = pgTable("production_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  currentStageId: varchar("current_stage_id").references(() => productionStages.id),
  assignedTo: varchar("assigned_to"),
  nextActionDate: timestamp("next_action_date"),
  nextActionNotes: text("next_action_notes"),
  completedStages: jsonb("completed_stages").default(sql`'[]'::jsonb`),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production notifications for daily reminders
export const productionNotifications = pgTable("production_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: varchar("tracking_id").notNull().references(() => productionTracking.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").notNull(),
  notificationDate: timestamp("notification_date").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  isSent: boolean("is_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProductionStage = typeof productionStages.$inferSelect;
export type InsertProductionStage = typeof productionStages.$inferInsert;
export type ProductionTracking = typeof productionTracking.$inferSelect;
export type InsertProductionTracking = typeof productionTracking.$inferInsert;
export type ProductionNotification = typeof productionNotifications.$inferSelect;
export type InsertProductionNotification = typeof productionNotifications.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type ArtworkItem = typeof artworkItems.$inferSelect;
export type InsertArtworkItem = typeof artworkItems.$inferInsert;
export type ArtworkFile = typeof artworkFiles.$inferSelect;
export type InsertArtworkFile = z.infer<typeof insertArtworkFileSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Error = typeof errors.$inferSelect;
export type InsertError = z.infer<typeof insertErrorSchema>;

export type DataUpload = typeof dataUploads.$inferSelect;
export type InsertWeeklyReportConfig = typeof weeklyReportConfig.$inferInsert;
export type WeeklyReportConfig = typeof weeklyReportConfig.$inferSelect;
export type InsertWeeklyReportLog = typeof weeklyReportLogs.$inferInsert;
export type WeeklyReportLog = typeof weeklyReportLogs.$inferSelect;
export type InsertDataUpload = z.infer<typeof insertDataUploadSchema>;

// Vendor Approval Request Types
export type VendorApprovalRequest = typeof vendorApprovalRequests.$inferSelect;
export type InsertVendorApprovalRequest = z.infer<typeof insertVendorApprovalRequestSchema>;

// ESP/ASI/SAGE Integration Types
export type EspProduct = typeof espProducts.$inferSelect;
export type SageProduct = typeof sageProducts.$inferSelect;
export type InsertSageProduct = typeof sageProducts.$inferInsert;
export type DistributorCentralProduct = typeof distributorCentralProducts.$inferSelect;
export type ProductSearchResult = typeof productSearchIndex.$inferSelect;
export type IntegrationConfig = typeof integrationConfigurations.$inferSelect;

// Newsletter Schema
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  status: varchar("status").default("active"), // active, unsubscribed, bounced
  source: varchar("source"), // website, import, api, form
  tags: jsonb("tags").$type<string[]>(), // for segmentation
  customFields: jsonb("custom_fields"), // flexible data storage
  subscriptionDate: timestamp("subscription_date").defaultNow(),
  unsubscribeDate: timestamp("unsubscribe_date"),
  lastEmailSent: timestamp("last_email_sent"),
  engagementScore: integer("engagement_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterLists = pgTable("newsletter_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  subscriberCount: integer("subscriber_count").default(0),
  segmentRules: jsonb("segment_rules"), // advanced segmentation logic
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterTemplates = pgTable("newsletter_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject"),
  previewText: varchar("preview_text"),
  htmlContent: text("html_content"),
  designData: jsonb("design_data"), // drag-and-drop editor data
  thumbnailUrl: varchar("thumbnail_url"),
  category: varchar("category"), // business, promotional, newsletter, etc.
  isPublic: boolean("is_public").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  previewText: varchar("preview_text"),
  fromName: varchar("from_name").notNull(),
  fromEmail: varchar("from_email").notNull(),
  replyTo: varchar("reply_to"),
  htmlContent: text("html_content"),
  status: varchar("status").default("draft"), // draft, scheduled, sending, sent, paused
  type: varchar("type").default("regular"), // regular, automation, ab_test
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  listId: varchar("list_id").references(() => newsletterLists.id),
  templateId: varchar("template_id").references(() => newsletterTemplates.id),
  // Analytics
  totalSent: integer("total_sent").default(0),
  delivered: integer("delivered").default(0),
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  unsubscribes: integer("unsubscribes").default(0),
  bounces: integer("bounces").default(0),
  // A/B Testing
  abTestSettings: jsonb("ab_test_settings"),
  // Automation
  automationRules: jsonb("automation_rules"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterAnalytics = pgTable("newsletter_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => newsletterCampaigns.id),
  subscriberId: varchar("subscriber_id").references(() => newsletterSubscribers.id),
  eventType: varchar("event_type").notNull(), // sent, delivered, opened, clicked, unsubscribed, bounced
  eventData: jsonb("event_data"), // additional event metadata
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const newsletterForms = pgTable("newsletter_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  title: varchar("title"),
  description: text("description"),
  formFields: jsonb("form_fields"), // field configuration
  formSettings: jsonb("form_settings"), // styling, behavior
  embedCode: text("embed_code"),
  isActive: boolean("is_active").default(true),
  conversions: integer("conversions").default(0),
  views: integer("views").default(0),
  listId: varchar("list_id").references(() => newsletterLists.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterAutomations = pgTable("newsletter_automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  trigger: varchar("trigger").notNull(), // signup, birthday, purchase, custom
  triggerData: jsonb("trigger_data"), // trigger configuration
  workflow: jsonb("workflow"), // automation steps and logic
  isActive: boolean("is_active").default(true),
  totalTriggered: integer("total_triggered").default(0),
  listId: varchar("list_id").references(() => newsletterLists.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter Relations
export const newsletterSubscribersRelations = relations(newsletterSubscribers, ({ many }) => ({
  analytics: many(newsletterAnalytics),
}));

export const newsletterListsRelations = relations(newsletterLists, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletterLists.createdBy],
    references: [users.id],
  }),
  campaigns: many(newsletterCampaigns),
  forms: many(newsletterForms),
  automations: many(newsletterAutomations),
}));

export const newsletterTemplatesRelations = relations(newsletterTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletterTemplates.createdBy],
    references: [users.id],
  }),
  campaigns: many(newsletterCampaigns),
}));

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletterCampaigns.createdBy],
    references: [users.id],
  }),
  list: one(newsletterLists, {
    fields: [newsletterCampaigns.listId],
    references: [newsletterLists.id],
  }),
  template: one(newsletterTemplates, {
    fields: [newsletterCampaigns.templateId],
    references: [newsletterTemplates.id],
  }),
  analytics: many(newsletterAnalytics),
}));

export const newsletterAnalyticsRelations = relations(newsletterAnalytics, ({ one }) => ({
  campaign: one(newsletterCampaigns, {
    fields: [newsletterAnalytics.campaignId],
    references: [newsletterCampaigns.id],
  }),
  subscriber: one(newsletterSubscribers, {
    fields: [newsletterAnalytics.subscriberId],
    references: [newsletterSubscribers.id],
  }),
}));

export const newsletterFormsRelations = relations(newsletterForms, ({ one }) => ({
  createdBy: one(users, {
    fields: [newsletterForms.createdBy],
    references: [users.id],
  }),
  list: one(newsletterLists, {
    fields: [newsletterForms.listId],
    references: [newsletterLists.id],
  }),
}));

export const newsletterAutomationsRelations = relations(newsletterAutomations, ({ one }) => ({
  createdBy: one(users, {
    fields: [newsletterAutomations.createdBy],
    references: [users.id],
  }),
  list: one(newsletterLists, {
    fields: [newsletterAutomations.listId],
    references: [newsletterLists.id],
  }),
}));

// Newsletter Insert schemas
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers);
export const insertNewsletterListSchema = createInsertSchema(newsletterLists);
export const insertNewsletterTemplateSchema = createInsertSchema(newsletterTemplates);
export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns);
export const insertNewsletterAnalyticsSchema = createInsertSchema(newsletterAnalytics);
export const insertNewsletterFormSchema = createInsertSchema(newsletterForms);
export const insertNewsletterAutomationSchema = createInsertSchema(newsletterAutomations);

// Newsletter Types
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewsletterList = typeof newsletterLists.$inferSelect;
export type NewsletterTemplate = typeof newsletterTemplates.$inferSelect;
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type NewsletterAnalytics = typeof newsletterAnalytics.$inferSelect;
export type NewsletterForm = typeof newsletterForms.$inferSelect;
export type NewsletterAutomation = typeof newsletterAutomations.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type InsertNewsletterList = z.infer<typeof insertNewsletterListSchema>;
export type InsertNewsletterTemplate = z.infer<typeof insertNewsletterTemplateSchema>;
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
export type InsertNewsletterAnalytics = z.infer<typeof insertNewsletterAnalyticsSchema>;
export type InsertNewsletterForm = z.infer<typeof insertNewsletterFormSchema>;
export type InsertNewsletterAutomation = z.infer<typeof insertNewsletterAutomationSchema>;

// Integration Settings Types
export type IntegrationSettings = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSettings = z.infer<typeof insertIntegrationSettingsSchema>;

// Generated Documents table
export const generatedDocuments = pgTable("generated_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  documentType: varchar("document_type").notNull(), // 'quote', 'purchase_order', 'invoice'
  documentNumber: varchar("document_number").notNull(),
  vendorId: varchar("vendor_id").references(() => suppliers.id), // For POs
  vendorName: varchar("vendor_name"), // Cached vendor name
  fileUrl: text("file_url"), // Cloudinary URL
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"), // In bytes
  status: varchar("status").default("draft"), // draft, sent, approved (quote only), paid (invoice only), cancelled
  generatedBy: varchar("generated_by").references(() => users.id),
  sentAt: timestamp("sent_at"),
  metadata: jsonb("metadata"), // Additional data like items snapshot, totals, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedDocumentsRelations = relations(generatedDocuments, ({ one }) => ({
  order: one(orders, {
    fields: [generatedDocuments.orderId],
    references: [orders.id],
  }),
  vendor: one(suppliers, {
    fields: [generatedDocuments.vendorId],
    references: [suppliers.id],
  }),
  generatedByUser: one(users, {
    fields: [generatedDocuments.generatedBy],
    references: [users.id],
  }),
}));

export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments);
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;
