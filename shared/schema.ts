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
  // HubSpot integration fields
  hubspotId: varchar("hubspot_id"),
  hubspotSyncedAt: timestamp("hubspot_synced_at"),
  // AI-powered insights
  lastNewsUpdate: timestamp("last_news_update"),
  newsAlerts: jsonb("news_alerts"),
  // Customer scoring and analytics
  customerScore: integer("customer_score").default(0),
  engagementLevel: varchar("engagement_level"), // high, medium, low
  // Additional addresses for multiple locations
  shippingAddresses: jsonb("shipping_addresses"),
  billingAddress: jsonb("billing_address"),
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
  // Enhanced vendor management
  ytdSpend: decimal("ytd_spend", { precision: 12, scale: 2 }).default("0"),
  lastYearSpend: decimal("last_year_spend", { precision: 12, scale: 2 }).default("0"),
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

export const insertDataUploadSchema = createInsertSchema(dataUploads).omit({
  id: true,
  createdAt: true,
  processedAt: true,
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
  weight: decimal("weight"),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description"),
  order: integer("order").notNull(),
  color: varchar("color").notNull().default("bg-gray-100 text-gray-800"),
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

export type DataUpload = typeof dataUploads.$inferSelect;
export type InsertDataUpload = z.infer<typeof insertDataUploadSchema>;

// ESP/ASI/SAGE Integration Types
export type EspProduct = typeof espProducts.$inferSelect;
export type SageProduct = typeof sageProducts.$inferSelect;
export type DistributorCentralProduct = typeof distributorCentralProducts.$inferSelect;
export type ProductSearchResult = typeof productSearchIndex.$inferSelect;
export type IntegrationConfig = typeof integrationConfigurations.$inferSelect;
