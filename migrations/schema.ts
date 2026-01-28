import { pgTable, foreignKey, varchar, text, jsonb, timestamp, integer, numeric, boolean, unique, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const errorType = pgEnum("error_type", ['pricing', 'in_hands_date', 'shipping', 'printing', 'artwork_proofing', 'oos', 'other'])
export const orderStatus = pgEnum("order_status", ['quote', 'pending_approval', 'approved', 'in_production', 'shipped', 'delivered', 'cancelled'])
export const resolutionType = pgEnum("resolution_type", ['refund', 'credit_for_future_order', 'reprint', 'courier_shipping', 'other'])
export const responsibleParty = pgEnum("responsible_party", ['customer', 'vendor', 'lsd'])


export const activities = pgTable("activities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	entityType: varchar("entity_type").notNull(),
	entityId: varchar("entity_id").notNull(),
	action: varchar().notNull(),
	description: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activities_user_id_users_id_fk"
		}),
]);

export const artworkCards = pgTable("artwork_cards", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	description: text(),
	columnId: varchar("column_id").notNull(),
	orderId: varchar("order_id"),
	companyId: varchar("company_id"),
	assignedUserId: varchar("assigned_user_id"),
	position: integer().notNull(),
	priority: varchar().default('medium'),
	dueDate: timestamp("due_date", { mode: 'string' }),
	labels: jsonb().default([]),
	attachments: jsonb().default([]),
	checklist: jsonb().default([]),
	comments: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.columnId],
			foreignColumns: [artworkColumns.id],
			name: "artwork_cards_column_id_artwork_columns_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "artwork_cards_order_id_orders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "artwork_cards_company_id_companies_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedUserId],
			foreignColumns: [users.id],
			name: "artwork_cards_assigned_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const companies = pgTable("companies", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	email: varchar(),
	phone: varchar(),
	website: varchar(),
	address: text(),
	city: varchar(),
	state: varchar(),
	zipCode: varchar("zip_code"),
	country: varchar().default('US'),
	industry: varchar(),
	notes: text(),
	ytdSpend: numeric("ytd_spend", { precision: 12, scale:  2 }).default('0'),
	hubspotId: varchar("hubspot_id"),
	hubspotSyncedAt: timestamp("hubspot_synced_at", { mode: 'string' }),
	socialMediaLinks: jsonb("social_media_links"),
	socialMediaPosts: jsonb("social_media_posts"),
	lastSocialMediaSync: timestamp("last_social_media_sync", { mode: 'string' }),
	lastNewsUpdate: timestamp("last_news_update", { mode: 'string' }),
	newsAlerts: jsonb("news_alerts"),
	excitingNewsFlags: jsonb("exciting_news_flags"),
	customerScore: integer("customer_score").default(0),
	engagementLevel: varchar("engagement_level"),
	shippingAddresses: jsonb("shipping_addresses"),
	billingAddress: jsonb("billing_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	qbCustomerId: varchar("qb_customer_id"),
	stripeCustomerId: varchar("stripe_customer_id"),
	taxExempt: boolean("tax_exempt").default(false),
});

export const artworkFiles = pgTable("artwork_files", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id"),
	companyId: varchar("company_id"),
	fileName: varchar("file_name").notNull(),
	originalName: varchar("original_name").notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type"),
	filePath: varchar("file_path").notNull(),
	thumbnailPath: varchar("thumbnail_path"),
	uploadedBy: varchar("uploaded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "artwork_files_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "artwork_files_company_id_companies_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "artwork_files_uploaded_by_users_id_fk"
		}),
]);

export const dataUploads = pgTable("data_uploads", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	fileName: varchar("file_name").notNull(),
	originalName: varchar("original_name").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: varchar("mime_type").notNull(),
	filePath: varchar("file_path").notNull(),
	uploadedBy: varchar("uploaded_by"),
	status: varchar().default('pending').notNull(),
	processedData: jsonb("processed_data"),
	createdRecords: jsonb("created_records"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "data_uploads_uploaded_by_users_id_fk"
		}),
]);

export const clients = pgTable("clients", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	email: varchar(),
	phone: varchar(),
	company: varchar(),
	title: varchar(),
	industry: varchar(),
	address: text(),
	city: varchar(),
	state: varchar(),
	zipCode: varchar("zip_code"),
	website: varchar(),
	preferredContact: varchar("preferred_contact").notNull(),
	clientType: varchar("client_type").notNull(),
	status: varchar().default('active').notNull(),
	notes: text(),
	totalOrders: integer("total_orders").default(0),
	totalSpent: numeric("total_spent", { precision: 12, scale:  2 }).default('0'),
	lastOrderDate: timestamp("last_order_date", { mode: 'string' }),
	accountManager: varchar("account_manager"),
	creditLimit: numeric("credit_limit", { precision: 12, scale:  2 }),
	paymentTerms: varchar("payment_terms"),
	socialMediaLinks: jsonb("social_media_links"),
	socialMediaPosts: jsonb("social_media_posts"),
	lastSocialMediaSync: timestamp("last_social_media_sync", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const automationTasks = pgTable("automation_tasks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskType: varchar("task_type").notNull(),
	entityType: varchar("entity_type").notNull(),
	entityId: varchar("entity_id").notNull(),
	status: varchar().default('pending'),
	aiDraftContent: text("ai_draft_content"),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	assignedTo: varchar("assigned_to"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "automation_tasks_assigned_to_users_id_fk"
		}),
]);

export const contacts = pgTable("contacts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	companyId: varchar("company_id"),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	email: varchar(),
	phone: varchar(),
	title: varchar(),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	supplierId: varchar("supplier_id"),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "contacts_company_id_companies_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "contacts_supplier_id_suppliers_id_fk"
		}),
]);

export const artworkColumns = pgTable("artwork_columns", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	position: integer().notNull(),
	color: varchar().default('#6B7280').notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const errors = pgTable("errors", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id"),
	date: timestamp({ mode: 'string' }).defaultNow().notNull(),
	projectNumber: varchar("project_number"),
	errorType: errorType("error_type").notNull(),
	clientName: varchar("client_name").notNull(),
	vendorName: varchar("vendor_name"),
	responsibleParty: responsibleParty("responsible_party").notNull(),
	resolution: resolutionType().notNull(),
	costToLsd: numeric("cost_to_lsd", { precision: 12, scale:  2 }).default('0'),
	productionRep: varchar("production_rep"),
	orderRep: varchar("order_rep"),
	clientRep: varchar("client_rep"),
	additionalNotes: text("additional_notes"),
	isResolved: boolean("is_resolved").default(false),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: varchar("resolved_by"),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "errors_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [users.id],
			name: "errors_resolved_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "errors_created_by_users_id_fk"
		}),
]);

export const espProducts = pgTable("esp_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	asiNumber: varchar("asi_number").notNull(),
	productName: varchar("product_name").notNull(),
	supplierId: varchar("supplier_id"),
	supplierAsiNumber: varchar("supplier_asi_number"),
	category: varchar(),
	subCategory: varchar("sub_category"),
	description: text(),
	longDescription: text("long_description"),
	specifications: jsonb(),
	pricingCode: varchar("pricing_code"),
	basePricing: jsonb("base_pricing"),
	decorationPricing: jsonb("decoration_pricing"),
	minimumQuantity: integer("minimum_quantity"),
	productionTime: varchar("production_time"),
	rushService: boolean("rush_service").default(false),
	decorationMethods: text("decoration_methods").array(),
	colors: text().array(),
	sizes: text().array(),
	imageUrls: text("image_urls").array(),
	espProductId: varchar("esp_product_id"),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }).defaultNow(),
	syncStatus: varchar("sync_status").default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "esp_products_supplier_id_suppliers_id_fk"
		}),
	unique("esp_products_esp_product_id_unique").on(table.espProductId),
]);

export const distributorCentralProducts = pgTable("distributor_central_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	dcProductId: varchar("dc_product_id").notNull(),
	productName: varchar("product_name").notNull(),
	supplierId: varchar("supplier_id"),
	category: varchar(),
	subcategory: varchar(),
	description: text(),
	keyFeatures: text("key_features").array(),
	decorationAreas: jsonb("decoration_areas"),
	imprintMethods: text("imprint_methods").array(),
	availableColors: text("available_colors").array(),
	availableSizes: text("available_sizes").array(),
	pricing: jsonb(),
	quantityPricing: jsonb("quantity_pricing"),
	minimumOrder: integer("minimum_order"),
	rushOptions: jsonb("rush_options"),
	productImages: text("product_images").array(),
	compliance: text().array(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }).defaultNow(),
	syncStatus: varchar("sync_status").default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "distributor_central_products_supplier_id_suppliers_id_fk"
		}),
	unique("distributor_central_products_dc_product_id_unique").on(table.dcProductId),
]);

export const integrationConfigurations = pgTable("integration_configurations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	integration: varchar().notNull(),
	displayName: varchar("display_name").notNull(),
	apiEndpoint: varchar("api_endpoint"),
	apiVersion: varchar("api_version"),
	syncEnabled: boolean("sync_enabled").default(false),
	syncFrequency: varchar("sync_frequency").default('daily'),
	categoryFilters: text("category_filters").array(),
	supplierFilters: text("supplier_filters").array(),
	priceRangeMin: numeric("price_range_min"),
	priceRangeMax: numeric("price_range_max"),
	maxApiCallsPerHour: integer("max_api_calls_per_hour").default(1000),
	isHealthy: boolean("is_healthy").default(true),
	lastHealthCheck: timestamp("last_health_check", { mode: 'string' }),
	totalSyncs: integer("total_syncs").default(0),
	totalRecordsSynced: integer("total_records_synced").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("integration_configurations_integration_unique").on(table.integration),
]);

export const integrationSyncs = pgTable("integration_syncs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	integrationType: varchar("integration_type").notNull(),
	syncType: varchar("sync_type").notNull(),
	status: varchar().notNull(),
	recordsProcessed: integer("records_processed").default(0),
	errorMessage: text("error_message"),
	metadata: jsonb(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
});

export const kpiMetrics = pgTable("kpi_metrics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	metricType: varchar("metric_type").notNull(),
	period: varchar().notNull(),
	periodDate: timestamp("period_date", { mode: 'string' }).notNull(),
	value: numeric({ precision: 12, scale:  2 }).notNull(),
	target: numeric({ precision: 12, scale:  2 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "kpi_metrics_user_id_users_id_fk"
		}),
]);

export const marketingSequences = pgTable("marketing_sequences", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	targetAudience: varchar("target_audience"),
	isActive: boolean("is_active").default(true),
	steps: jsonb(),
	aiGenerated: boolean("ai_generated").default(false),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "marketing_sequences_created_by_users_id_fk"
		}),
]);

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	subject: varchar().notNull(),
	previewText: varchar("preview_text"),
	fromName: varchar("from_name").notNull(),
	fromEmail: varchar("from_email").notNull(),
	replyTo: varchar("reply_to"),
	htmlContent: text("html_content"),
	status: varchar().default('draft'),
	type: varchar().default('regular'),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	listId: varchar("list_id"),
	templateId: varchar("template_id"),
	totalSent: integer("total_sent").default(0),
	delivered: integer().default(0),
	opens: integer().default(0),
	clicks: integer().default(0),
	unsubscribes: integer().default(0),
	bounces: integer().default(0),
	abTestSettings: jsonb("ab_test_settings"),
	automationRules: jsonb("automation_rules"),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.listId],
			foreignColumns: [newsletterLists.id],
			name: "newsletter_campaigns_list_id_newsletter_lists_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [newsletterTemplates.id],
			name: "newsletter_campaigns_template_id_newsletter_templates_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "newsletter_campaigns_created_by_users_id_fk"
		}),
]);

export const newsTracking = pgTable("news_tracking", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	entityType: varchar("entity_type").notNull(),
	entityId: varchar("entity_id"),
	headline: varchar().notNull(),
	summary: text(),
	sourceUrl: varchar("source_url"),
	sentiment: varchar(),
	relevanceScore: integer("relevance_score"),
	alertsSent: boolean("alerts_sent").default(false),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const newsletterAutomations = pgTable("newsletter_automations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	trigger: varchar().notNull(),
	triggerData: jsonb("trigger_data"),
	workflow: jsonb(),
	isActive: boolean("is_active").default(true),
	totalTriggered: integer("total_triggered").default(0),
	listId: varchar("list_id"),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.listId],
			foreignColumns: [newsletterLists.id],
			name: "newsletter_automations_list_id_newsletter_lists_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "newsletter_automations_created_by_users_id_fk"
		}),
]);

export const knowledgeBase = pgTable("knowledge_base", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	content: text().notNull(),
	category: varchar(),
	tags: jsonb(),
	accessLevel: varchar("access_level").default('all'),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdBy: varchar("created_by"),
	searchVector: text("search_vector"),
	usageCount: integer("usage_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "knowledge_base_created_by_users_id_fk"
		}),
]);

export const newsletterTemplates = pgTable("newsletter_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	subject: varchar(),
	previewText: varchar("preview_text"),
	htmlContent: text("html_content"),
	designData: jsonb("design_data"),
	thumbnailUrl: varchar("thumbnail_url"),
	category: varchar(),
	isPublic: boolean("is_public").default(false),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "newsletter_templates_created_by_users_id_fk"
		}),
]);

export const newsletterLists = pgTable("newsletter_lists", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	subscriberCount: integer("subscriber_count").default(0),
	segmentRules: jsonb("segment_rules"),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "newsletter_lists_created_by_users_id_fk"
		}),
]);

export const newsletterForms = pgTable("newsletter_forms", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	title: varchar(),
	description: text(),
	formFields: jsonb("form_fields"),
	formSettings: jsonb("form_settings"),
	embedCode: text("embed_code"),
	isActive: boolean("is_active").default(true),
	conversions: integer().default(0),
	views: integer().default(0),
	listId: varchar("list_id"),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.listId],
			foreignColumns: [newsletterLists.id],
			name: "newsletter_forms_list_id_newsletter_lists_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "newsletter_forms_created_by_users_id_fk"
		}),
]);

export const presentationFiles = pgTable("presentation_files", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	presentationId: varchar("presentation_id").notNull(),
	fileName: varchar("file_name").notNull(),
	fileType: varchar("file_type").notNull(),
	fileSize: integer("file_size"),
	filePath: varchar("file_path").notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.presentationId],
			foreignColumns: [presentations.id],
			name: "presentation_files_presentation_id_presentations_id_fk"
		}).onDelete("cascade"),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	status: varchar().default('active'),
	source: varchar(),
	tags: jsonb(),
	customFields: jsonb("custom_fields"),
	subscriptionDate: timestamp("subscription_date", { mode: 'string' }).defaultNow(),
	unsubscribeDate: timestamp("unsubscribe_date", { mode: 'string' }),
	lastEmailSent: timestamp("last_email_sent", { mode: 'string' }),
	engagementScore: integer("engagement_score").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id"),
	productId: varchar("product_id"),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 12, scale:  2 }).notNull(),
	color: varchar(),
	size: varchar(),
	imprintLocation: varchar("imprint_location"),
	imprintMethod: varchar("imprint_method"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	supplierId: varchar("supplier_id"),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "order_items_supplier_id_suppliers_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderNumber: varchar("order_number").notNull(),
	companyId: varchar("company_id"),
	contactId: varchar("contact_id"),
	assignedUserId: varchar("assigned_user_id"),
	status: orderStatus().default('quote'),
	orderType: varchar("order_type").default('quote'),
	subtotal: numeric({ precision: 12, scale:  2 }).default('0'),
	tax: numeric({ precision: 12, scale:  2 }).default('0'),
	shipping: numeric({ precision: 12, scale:  2 }).default('0'),
	total: numeric({ precision: 12, scale:  2 }).default('0'),
	margin: numeric({ precision: 5, scale:  2 }).default('0'),
	inHandsDate: timestamp("in_hands_date", { mode: 'string' }),
	eventDate: timestamp("event_date", { mode: 'string' }),
	supplierInHandsDate: timestamp("supplier_in_hands_date", { mode: 'string' }),
	isFirm: boolean("is_firm").default(false),
	notes: text(),
	customerNotes: text("customer_notes"),
	internalNotes: text("internal_notes"),
	trackingNumber: varchar("tracking_number"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	shippingAddress: text("shipping_address"),
	billingAddress: text("billing_address"),
	currentStage: varchar("current_stage").default('sales-booked').notNull(),
	stagesCompleted: jsonb("stages_completed").default(["sales-booked"]).notNull(),
	stageData: jsonb("stage_data").default({}).notNull(),
	customNotes: jsonb("custom_notes").default({}).notNull(),
	shippingMethod: varchar("shipping_method"),
	csrUserId: varchar("csr_user_id"),
	customerPo: varchar("customer_po"),
	paymentTerms: varchar("payment_terms").default('Net 30'),
	orderDiscount: numeric("order_discount", { precision: 12, scale:  2 }).default('0'),
	qbInvoiceId: varchar("qb_invoice_id"),
	stripePaymentIntentId: varchar("stripe_payment_intent_id"),
	taxCalculatedAt: timestamp("tax_calculated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "orders_company_id_companies_id_fk"
		}),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "orders_contact_id_contacts_id_fk"
		}),
	foreignKey({
			columns: [table.assignedUserId],
			foreignColumns: [users.id],
			name: "orders_assigned_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.csrUserId],
			foreignColumns: [users.id],
			name: "orders_csr_user_id_users_id_fk"
		}),
	unique("orders_order_number_unique").on(table.orderNumber),
]);

export const productSearchIndex = pgTable("product_search_index", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sourceSystem: varchar("source_system").notNull(),
	sourceProductId: varchar("source_product_id").notNull(),
	productName: varchar("product_name").notNull(),
	category: varchar(),
	subcategory: varchar(),
	supplierId: varchar("supplier_id"),
	supplierName: varchar("supplier_name"),
	asiNumber: varchar("asi_number"),
	description: text(),
	keyTerms: text("key_terms").array(),
	minPrice: numeric("min_price"),
	maxPrice: numeric("max_price"),
	minQuantity: integer("min_quantity"),
	decorationMethods: text("decoration_methods").array(),
	colors: text().array(),
	primaryImage: varchar("primary_image"),
	qualityScore: numeric("quality_score"),
	popularityScore: integer("popularity_score").default(0),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	searchRank: integer("search_rank").default(0),
	isActive: boolean("is_active").default(true),
});

export const productCategories = pgTable("product_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const productionNotifications = pgTable("production_notifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	trackingId: varchar("tracking_id").notNull(),
	assignedTo: varchar("assigned_to").notNull(),
	notificationDate: timestamp("notification_date", { mode: 'string' }).notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	isSent: boolean("is_sent").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.trackingId],
			foreignColumns: [productionTracking.id],
			name: "production_notifications_tracking_id_production_tracking_id_fk"
		}).onDelete("cascade"),
]);

export const reportTemplates = pgTable("report_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	query: text().notNull(),
	parameters: jsonb(),
	schedule: varchar(),
	recipients: jsonb(),
	isActive: boolean("is_active").default(true),
	createdBy: varchar("created_by"),
	lastRun: timestamp("last_run", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "report_templates_created_by_users_id_fk"
		}),
]);

export const productionStages = pgTable("production_stages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: varchar(),
	order: integer().notNull(),
	color: varchar().default('bg-gray-100 text-gray-800').notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const productionTracking = pgTable("production_tracking", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	currentStageId: varchar("current_stage_id"),
	assignedTo: varchar("assigned_to"),
	nextActionDate: timestamp("next_action_date", { mode: 'string' }),
	nextActionNotes: text("next_action_notes"),
	completedStages: jsonb("completed_stages").default([]),
	priority: varchar().default('medium'),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "production_tracking_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.currentStageId],
			foreignColumns: [productionStages.id],
			name: "production_tracking_current_stage_id_production_stages_id_fk"
		}),
]);

export const sageProducts = pgTable("sage_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sageId: varchar("sage_id").notNull(),
	productName: varchar("product_name").notNull(),
	productNumber: varchar("product_number"),
	supplierId: varchar("supplier_id"),
	category: varchar(),
	subcategory: varchar(),
	brand: varchar(),
	description: text(),
	features: text().array(),
	materials: text().array(),
	dimensions: varchar(),
	weight: numeric({ precision: 10, scale:  4 }),
	eqpLevel: varchar("eqp_level"),
	pricingStructure: jsonb("pricing_structure"),
	quantityBreaks: jsonb("quantity_breaks"),
	setupCharges: jsonb("setup_charges"),
	decorationMethods: text("decoration_methods").array(),
	leadTimes: jsonb("lead_times"),
	imageGallery: text("image_gallery").array(),
	technicalDrawings: text("technical_drawings").array(),
	complianceCertifications: text("compliance_certifications").array(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }).defaultNow(),
	syncStatus: varchar("sync_status").default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "sage_products_supplier_id_suppliers_id_fk"
		}),
	unique("sage_products_sage_id_unique").on(table.sageId),
]);

export const sequenceAnalytics = pgTable("sequence_analytics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sequenceId: varchar("sequence_id").notNull(),
	date: varchar().notNull(),
	totalEnrollments: integer("total_enrollments").default(0),
	totalSent: integer("total_sent").default(0),
	totalOpened: integer("total_opened").default(0),
	totalClicked: integer("total_clicked").default(0),
	totalReplied: integer("total_replied").default(0),
	totalBounced: integer("total_bounced").default(0),
	totalMeetingsBooked: integer("total_meetings_booked").default(0),
	totalDealsCreated: integer("total_deals_created").default(0),
	totalRevenue: numeric("total_revenue", { precision: 10, scale:  2 }).default('0.00'),
}, (table) => [
	foreignKey({
			columns: [table.sequenceId],
			foreignColumns: [sequences.id],
			name: "sequence_analytics_sequence_id_sequences_id_fk"
		}).onDelete("cascade"),
]);

export const sequenceEnrollments = pgTable("sequence_enrollments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sequenceId: varchar("sequence_id").notNull(),
	contactId: varchar("contact_id").notNull(),
	contactType: varchar("contact_type").notNull(),
	status: varchar().default('active').notNull(),
	currentStep: integer("current_step").default(1).notNull(),
	enrolledBy: varchar("enrolled_by").notNull(),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	unenrolledAt: timestamp("unenrolled_at", { mode: 'string' }),
	unenrollReason: varchar("unenroll_reason"),
}, (table) => [
	foreignKey({
			columns: [table.sequenceId],
			foreignColumns: [sequences.id],
			name: "sequence_enrollments_sequence_id_sequences_id_fk"
		}).onDelete("cascade"),
]);

export const sequenceStepExecutions = pgTable("sequence_step_executions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	enrollmentId: varchar("enrollment_id").notNull(),
	stepId: varchar("step_id").notNull(),
	status: varchar().default('pending').notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	executedAt: timestamp("executed_at", { mode: 'string' }),
	openedAt: timestamp("opened_at", { mode: 'string' }),
	clickedAt: timestamp("clicked_at", { mode: 'string' }),
	repliedAt: timestamp("replied_at", { mode: 'string' }),
	bounced: boolean().default(false),
	metadata: text(),
}, (table) => [
	foreignKey({
			columns: [table.stepId],
			foreignColumns: [sequenceSteps.id],
			name: "sequence_step_executions_step_id_sequence_steps_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.enrollmentId],
			foreignColumns: [sequenceEnrollments.id],
			name: "sequence_step_executions_enrollment_id_sequence_enrollments_id_"
		}).onDelete("cascade"),
]);

export const sequenceSteps = pgTable("sequence_steps", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sequenceId: varchar("sequence_id").notNull(),
	type: varchar().notNull(),
	position: integer().notNull(),
	title: varchar().notNull(),
	content: text(),
	delayDays: integer("delay_days").default(1).notNull(),
	delayHours: integer("delay_hours").default(0).notNull(),
	delayMinutes: integer("delay_minutes").default(0).notNull(),
	settings: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.sequenceId],
			foreignColumns: [sequences.id],
			name: "sequence_steps_sequence_id_sequences_id_fk"
		}).onDelete("cascade"),
]);

export const sequenceTemplates = pgTable("sequence_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	category: varchar().notNull(),
	industryType: varchar("industry_type"),
	steps: text().notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const products = pgTable("products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	supplierId: varchar("supplier_id"),
	categoryId: varchar("category_id"),
	name: varchar().notNull(),
	description: text(),
	sku: varchar(),
	supplierSku: varchar("supplier_sku"),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }),
	minimumQuantity: integer("minimum_quantity").default(1),
	sizes: text().array(),
	imprintMethods: text("imprint_methods"),
	leadTime: integer("lead_time"),
	imageUrl: varchar("image_url"),
	productType: varchar("product_type").default('apparel'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	brand: varchar(),
	category: varchar(),
	colors: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "products_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [productCategories.id],
			name: "products_category_id_product_categories_id_fk"
		}),
]);

export const slackMessages = pgTable("slack_messages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	channelId: varchar("channel_id").notNull(),
	messageId: varchar("message_id").notNull(),
	userId: varchar("user_id"),
	content: text(),
	attachments: jsonb(),
	threadTs: varchar("thread_ts"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const ssActivewearImportJobs = pgTable("ss_activewear_import_jobs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	status: varchar().default('pending').notNull(),
	totalProducts: integer("total_products").default(0),
	processedProducts: integer("processed_products").default(0),
	newProducts: integer("new_products").default(0),
	updatedProducts: integer("updated_products").default(0),
	errorCount: integer("error_count").default(0),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const ssActivewearProducts = pgTable("ss_activewear_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sku: varchar().notNull(),
	gtin: varchar(),
	styleId: integer("style_id"),
	brandName: varchar("brand_name"),
	styleName: varchar("style_name"),
	colorName: varchar("color_name"),
	colorCode: varchar("color_code"),
	sizeName: varchar("size_name"),
	sizeCode: varchar("size_code"),
	unitWeight: numeric("unit_weight", { precision: 10, scale:  4 }),
	caseQty: integer("case_qty"),
	piecePrice: numeric("piece_price", { precision: 10, scale:  2 }),
	dozenPrice: numeric("dozen_price", { precision: 10, scale:  2 }),
	casePrice: numeric("case_price", { precision: 10, scale:  2 }),
	customerPrice: numeric("customer_price", { precision: 10, scale:  2 }),
	qty: integer().default(0),
	colorFrontImage: varchar("color_front_image"),
	colorBackImage: varchar("color_back_image"),
	colorSideImage: varchar("color_side_image"),
	colorSwatchImage: varchar("color_swatch_image"),
	countryOfOrigin: varchar("country_of_origin"),
	isActive: boolean("is_active").default(true),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("ss_activewear_products_sku_unique").on(table.sku),
]);

export const weeklyReportConfig = pgTable("weekly_report_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	metricName: varchar("metric_name").notNull(),
	displayName: varchar("display_name").notNull(),
	description: text(),
	dataSource: varchar("data_source").notNull(),
	calculationMethod: varchar("calculation_method").notNull(),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const weeklyReportLogs = pgTable("weekly_report_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	reportWeekStart: timestamp("report_week_start", { mode: 'string' }).notNull(),
	reportWeekEnd: timestamp("report_week_end", { mode: 'string' }).notNull(),
	metricsData: jsonb("metrics_data").notNull(),
	emailSentAt: timestamp("email_sent_at", { mode: 'string' }),
	emailStatus: varchar("email_status").default('pending'),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	role: varchar().default('user'),
	emailReportsEnabled: boolean("email_reports_enabled").default(true),
	lastEmailReportSent: timestamp("last_email_report_sent", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const sequences = pgTable("sequences", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	userId: varchar("user_id").notNull(),
	status: varchar().default('draft').notNull(),
	totalSteps: integer("total_steps").default(0).notNull(),
	automation: integer().default(100).notNull(),
	unenrollCriteria: text("unenroll_criteria"),
	settings: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const suppliers = pgTable("suppliers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	email: varchar(),
	phone: varchar(),
	website: varchar(),
	address: text(),
	contactPerson: varchar("contact_person"),
	paymentTerms: varchar("payment_terms"),
	notes: text(),
	isPreferred: boolean("is_preferred").default(false),
	doNotOrder: boolean("do_not_order").default(false),
	ytdSpend: numeric("ytd_spend", { precision: 12, scale:  2 }).default('0'),
	lastYearSpend: numeric("last_year_spend", { precision: 12, scale:  2 }).default('0'),
	preferredBenefits: jsonb("preferred_benefits"),
	vendorOffers: jsonb("vendor_offers"),
	autoNotifications: boolean("auto_notifications").default(true),
	lastOrderDate: timestamp("last_order_date", { mode: 'string' }),
	orderConfirmationReminder: boolean("order_confirmation_reminder").default(true),
	espId: varchar("esp_id"),
	asiId: varchar("asi_id"),
	sageId: varchar("sage_id"),
	distributorCentralId: varchar("distributor_central_id"),
	apiIntegrationStatus: varchar("api_integration_status"),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	productCount: integer("product_count").default(0),
});

export const newsletterAnalytics = pgTable("newsletter_analytics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	campaignId: varchar("campaign_id"),
	subscriberId: varchar("subscriber_id"),
	eventType: varchar("event_type").notNull(),
	eventData: jsonb("event_data"),
	userAgent: varchar("user_agent"),
	ipAddress: varchar("ip_address"),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [newsletterCampaigns.id],
			name: "newsletter_analytics_campaign_id_newsletter_campaigns_id_fk"
		}),
	foreignKey({
			columns: [table.subscriberId],
			foreignColumns: [newsletterSubscribers.id],
			name: "newsletter_analytics_subscriber_id_newsletter_subscribers_id_fk"
		}),
]);

export const presentations = pgTable("presentations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	description: text(),
	dealNotes: text("deal_notes"),
	hubspotDealId: varchar("hubspot_deal_id"),
	suggestedProducts: jsonb("suggested_products").default([]),
	slides: jsonb().default([]),
	status: varchar().default('draft'),
	userId: varchar("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const communications = pgTable("communications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	userId: varchar("user_id").notNull(),
	communicationType: varchar("communication_type").notNull(),
	direction: varchar().notNull(),
	recipientEmail: varchar("recipient_email").notNull(),
	recipientName: varchar("recipient_name"),
	subject: varchar().notNull(),
	body: text().notNull(),
	metadata: jsonb(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "communications_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "communications_user_id_users_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	recipientId: varchar("recipient_id").notNull(),
	senderId: varchar("sender_id"),
	orderId: varchar("order_id"),
	activityId: varchar("activity_id"),
	type: varchar().notNull(),
	title: varchar().notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "notifications_recipient_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "notifications_sender_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "notifications_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [projectActivities.id],
			name: "notifications_activity_id_project_activities_id_fk"
		}),
]);

export const projectActivities = pgTable("project_activities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	userId: varchar("user_id").notNull(),
	activityType: varchar("activity_type").notNull(),
	content: text().notNull(),
	metadata: jsonb(),
	mentionedUsers: jsonb("mentioned_users"),
	isSystemGenerated: boolean("is_system_generated").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "project_activities_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_activities_user_id_users_id_fk"
		}),
]);

export const integrationSettings = pgTable("integration_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	ssActivewearAccount: varchar("ss_activewear_account"),
	ssActivewearApiKey: text("ss_activewear_api_key"),
	slackBotToken: text("slack_bot_token"),
	slackChannelId: varchar("slack_channel_id"),
	hubspotApiKey: text("hubspot_api_key"),
	quickbooksConnected: boolean("quickbooks_connected").default(false),
	stripeConnected: boolean("stripe_connected").default(false),
	shipmateConnected: boolean("shipmate_connected").default(false),
	updatedBy: varchar("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	sageAcctId: varchar("sage_acct_id"),
	sageLoginId: varchar("sage_login_id"),
	sageApiKey: text("sage_api_key"),
	emailProvider: varchar("email_provider"),
	smtpHost: varchar("smtp_host"),
	smtpPort: integer("smtp_port"),
	smtpUser: varchar("smtp_user"),
	smtpPassword: text("smtp_password"),
	emailFromAddress: varchar("email_from_address"),
	emailFromName: varchar("email_from_name"),
	emailReplyTo: varchar("email_reply_to"),
	sanmarCustomerId: varchar("sanmar_customer_id"),
	sanmarUsername: varchar("sanmar_username"),
	sanmarPassword: text("sanmar_password"),
	qbRealmId: varchar("qb_realm_id"),
	qbAccessToken: text("qb_access_token"),
	qbRefreshToken: text("qb_refresh_token"),
	qbClientId: text("qb_client_id"),
	qbClientSecret: text("qb_client_secret"),
	stripePublishableKey: text("stripe_publishable_key"),
	stripeSecretKey: text("stripe_secret_key"),
	stripeWebhookSecret: text("stripe_webhook_secret"),
	taxjarApiKey: text("taxjar_api_key"),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "integration_settings_updated_by_users_id_fk"
		}),
]);

export const artworkApprovals = pgTable("artwork_approvals", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	orderItemId: varchar("order_item_id"),
	artworkFileId: varchar("artwork_file_id"),
	approvalToken: varchar("approval_token", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	clientEmail: varchar("client_email", { length: 255 }),
	clientName: varchar("client_name", { length: 255 }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	declinedAt: timestamp("declined_at", { mode: 'string' }),
	declineReason: text("decline_reason"),
	pdfPath: varchar("pdf_path", { length: 500 }),
	reminderSentAt: timestamp("reminder_sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "artwork_approvals_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "artwork_approvals_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.artworkFileId],
			foreignColumns: [artworkFiles.id],
			name: "artwork_approvals_artwork_file_id_artwork_files_id_fk"
		}),
	unique("artwork_approvals_approval_token_unique").on(table.approvalToken),
]);

export const attachments = pgTable("attachments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id"),
	communicationId: varchar("communication_id"),
	filename: varchar().notNull(),
	originalFilename: varchar("original_filename").notNull(),
	storagePath: varchar("storage_path").notNull(),
	mimeType: varchar("mime_type"),
	fileSize: integer("file_size"),
	category: varchar().default('attachment'),
	uploadedBy: varchar("uploaded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "attachments_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.communicationId],
			foreignColumns: [communications.id],
			name: "attachments_communication_id_communications_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "attachments_uploaded_by_users_id_fk"
		}),
]);

export const presentationProducts = pgTable("presentation_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	presentationId: varchar("presentation_id").notNull(),
	productId: varchar("product_id"),
	productName: varchar("product_name").notNull(),
	suggestedPrice: numeric("suggested_price", { precision: 10, scale:  2 }),
	suggestedQuantity: integer("suggested_quantity"),
	reasoning: text(),
	isIncluded: boolean("is_included").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.presentationId],
			foreignColumns: [presentations.id],
			name: "presentation_products_presentation_id_presentations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "presentation_products_product_id_products_id_fk"
		}),
]);

export const vendorInvoices = pgTable("vendor_invoices", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	supplierId: varchar("supplier_id"),
	orderId: varchar("order_id"),
	invoiceNumber: varchar("invoice_number").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	status: varchar().default('pending'),
	qbBillId: varchar("qb_bill_id"),
	receivedDate: timestamp("received_date", { mode: 'string' }).defaultNow(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "vendor_invoices_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "vendor_invoices_order_id_orders_id_fk"
		}),
]);

export const orderFiles = pgTable("order_files", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	orderItemId: varchar("order_item_id"),
	fileName: varchar("file_name").notNull(),
	originalName: varchar("original_name").notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type"),
	filePath: varchar("file_path").notNull(),
	thumbnailPath: varchar("thumbnail_path"),
	fileType: varchar("file_type").default('document').notNull(),
	tags: jsonb().default([]),
	uploadedBy: varchar("uploaded_by"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_files_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "order_files_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "order_files_uploaded_by_users_id_fk"
		}),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	invoiceId: varchar("invoice_id"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	paymentMethod: varchar("payment_method").notNull(),
	paymentReference: varchar("payment_reference"),
	status: varchar().default('pending'),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "payment_transactions_invoice_id_invoices_id_fk"
		}),
]);

export const invoices = pgTable("invoices", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id"),
	invoiceNumber: varchar("invoice_number").notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 12, scale:  2 }).default('0'),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar().default('pending'),
	dueDate: timestamp("due_date", { mode: 'string' }),
	qbInvoiceId: varchar("qb_invoice_id"),
	qbSyncedAt: timestamp("qb_synced_at", { mode: 'string' }),
	stripePaymentIntentId: varchar("stripe_payment_intent_id"),
	paymentMethod: varchar("payment_method"),
	paymentReference: varchar("payment_reference"),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	stripeInvoiceId: varchar("stripe_invoice_id"),
	stripeInvoiceUrl: text("stripe_invoice_url"),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "invoices_order_id_orders_id_fk"
		}),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);
