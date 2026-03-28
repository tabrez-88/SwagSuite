CREATE TYPE "public"."error_type" AS ENUM('pricing', 'in_hands_date', 'shipping', 'printing', 'artwork_proofing', 'oos', 'other');--> statement-breakpoint
CREATE TYPE "public"."resolution_type" AS ENUM('refund', 'credit_for_future_order', 'reprint', 'courier_shipping', 'other');--> statement-breakpoint
CREATE TYPE "public"."responsible_party" AS ENUM('customer', 'vendor', 'lsd');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('quote', 'pending_approval', 'approved', 'in_production', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artwork_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"order_item_id" varchar,
	"artwork_file_id" varchar,
	"artwork_item_id" varchar,
	"approval_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"client_email" varchar(255),
	"client_name" varchar(255),
	"sent_at" timestamp,
	"approved_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"pdf_path" varchar(500),
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "artwork_approvals_approval_token_unique" UNIQUE("approval_token")
);
--> statement-breakpoint
CREATE TABLE "artwork_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"company_id" varchar,
	"file_name" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"file_path" varchar NOT NULL,
	"thumbnail_path" varchar,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artwork_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"artwork_type" varchar(100),
	"location" varchar(255),
	"color" varchar(100),
	"size" varchar(100),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"file_name" varchar(500),
	"file_path" varchar(500),
	"proof_required" boolean DEFAULT true,
	"proof_file_path" varchar(500),
	"proof_file_name" varchar(500),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artwork_cards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"column_id" varchar NOT NULL,
	"order_id" varchar,
	"company_id" varchar,
	"assigned_user_id" varchar,
	"position" integer NOT NULL,
	"priority" varchar DEFAULT 'medium',
	"due_date" timestamp,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"comments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artwork_columns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"position" integer NOT NULL,
	"color" varchar DEFAULT '#6B7280' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"communication_id" varchar,
	"filename" varchar NOT NULL,
	"original_filename" varchar NOT NULL,
	"storage_path" varchar NOT NULL,
	"mime_type" varchar,
	"file_size" integer,
	"category" varchar DEFAULT 'attachment',
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"company" varchar,
	"title" varchar,
	"industry" varchar,
	"address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"website" varchar,
	"preferred_contact" varchar NOT NULL,
	"client_type" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"notes" text,
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(12, 2) DEFAULT '0',
	"last_order_date" timestamp,
	"account_manager" varchar,
	"credit_limit" numeric(12, 2),
	"payment_terms" varchar,
	"social_media_links" jsonb,
	"social_media_posts" jsonb,
	"last_social_media_sync" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"communication_type" varchar NOT NULL,
	"direction" varchar NOT NULL,
	"recipient_email" varchar NOT NULL,
	"recipient_name" varchar,
	"subject" varchar NOT NULL,
	"body" text NOT NULL,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"address_name" varchar,
	"company_name_on_docs" varchar,
	"street" text,
	"street2" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"country" varchar DEFAULT 'US',
	"address_type" varchar DEFAULT 'both' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"website" varchar,
	"industry" varchar,
	"notes" text,
	"ytd_spend" numeric(12, 2) DEFAULT '0',
	"hubspot_id" varchar,
	"hubspot_synced_at" timestamp,
	"qb_customer_id" varchar,
	"stripe_customer_id" varchar,
	"tax_exempt" boolean DEFAULT false,
	"social_media_links" jsonb,
	"social_media_posts" jsonb,
	"last_social_media_sync" timestamp,
	"last_news_update" timestamp,
	"news_alerts" jsonb,
	"exciting_news_flags" jsonb,
	"customer_score" integer DEFAULT 0,
	"engagement_level" varchar,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"supplier_id" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"title" varchar,
	"is_primary" boolean DEFAULT false,
	"receive_order_emails" boolean DEFAULT true,
	"lead_source" varchar,
	"department" varchar,
	"is_active" boolean DEFAULT true,
	"mailing_address" text,
	"no_marketing" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kpi_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"metric_type" varchar NOT NULL,
	"period" varchar NOT NULL,
	"period_date" timestamp NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"target" numeric(12, 2),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"query" text NOT NULL,
	"parameters" jsonb,
	"schedule" varchar,
	"recipients" jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" varchar,
	"last_run" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "slack_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar,
	"content" text,
	"attachments" jsonb,
	"thread_ts" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"uploaded_by" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"processed_data" jsonb,
	"created_records" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "distributor_central_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dc_product_id" varchar NOT NULL,
	"product_name" varchar NOT NULL,
	"supplier_id" varchar,
	"category" varchar,
	"subcategory" varchar,
	"description" text,
	"key_features" text[],
	"decoration_areas" jsonb,
	"imprint_methods" text[],
	"available_colors" text[],
	"available_sizes" text[],
	"pricing" jsonb,
	"quantity_pricing" jsonb,
	"minimum_order" integer,
	"rush_options" jsonb,
	"product_images" text[],
	"compliance" text[],
	"last_synced_at" timestamp DEFAULT now(),
	"sync_status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "distributor_central_products_dc_product_id_unique" UNIQUE("dc_product_id")
);
--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"document_type" varchar NOT NULL,
	"document_number" varchar NOT NULL,
	"vendor_id" varchar,
	"vendor_name" varchar,
	"file_url" text,
	"file_name" varchar NOT NULL,
	"file_size" integer,
	"status" varchar DEFAULT 'draft',
	"generated_by" varchar,
	"sent_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "po_confirmations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"document_id" varchar,
	"confirmation_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"vendor_email" varchar(255),
	"vendor_name" varchar(255),
	"vendor_id" varchar,
	"po_total" numeric(12, 2),
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"confirmed_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"confirmation_notes" text,
	"pdf_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "po_confirmations_confirmation_token_unique" UNIQUE("confirmation_token")
);
--> statement-breakpoint
CREATE TABLE "quote_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"document_id" varchar,
	"approval_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"client_email" varchar(255),
	"client_name" varchar(255),
	"quote_total" numeric(12, 2),
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"approved_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"approval_notes" text,
	"pdf_path" varchar(500),
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quote_approvals_approval_token_unique" UNIQUE("approval_token")
);
--> statement-breakpoint
CREATE TABLE "errors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"date" timestamp DEFAULT now() NOT NULL,
	"project_number" varchar,
	"error_type" "error_type" NOT NULL,
	"client_name" varchar NOT NULL,
	"vendor_name" varchar,
	"responsible_party" "responsible_party" NOT NULL,
	"resolution" "resolution_type" NOT NULL,
	"cost_to_lsd" numeric(12, 2) DEFAULT '0',
	"production_rep" varchar,
	"order_rep" varchar,
	"client_rep" varchar,
	"additional_notes" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "esp_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asi_number" varchar NOT NULL,
	"product_name" varchar NOT NULL,
	"supplier_id" varchar,
	"supplier_asi_number" varchar,
	"category" varchar,
	"sub_category" varchar,
	"description" text,
	"long_description" text,
	"specifications" jsonb,
	"pricing_code" varchar,
	"base_pricing" jsonb,
	"decoration_pricing" jsonb,
	"minimum_quantity" integer,
	"production_time" varchar,
	"rush_service" boolean DEFAULT false,
	"decoration_methods" text[],
	"colors" text[],
	"sizes" text[],
	"image_urls" text[],
	"esp_product_id" varchar,
	"last_synced_at" timestamp DEFAULT now(),
	"sync_status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "esp_products_esp_product_id_unique" UNIQUE("esp_product_id")
);
--> statement-breakpoint
CREATE TABLE "integration_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"api_endpoint" varchar,
	"api_version" varchar,
	"sync_enabled" boolean DEFAULT false,
	"sync_frequency" varchar DEFAULT 'daily',
	"category_filters" text[],
	"supplier_filters" text[],
	"price_range_min" numeric,
	"price_range_max" numeric,
	"max_api_calls_per_hour" integer DEFAULT 1000,
	"is_healthy" boolean DEFAULT true,
	"last_health_check" timestamp,
	"total_syncs" integer DEFAULT 0,
	"total_records_synced" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "integration_configurations_integration_unique" UNIQUE("integration")
);
--> statement-breakpoint
CREATE TABLE "integration_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ss_activewear_account" varchar,
	"ss_activewear_api_key" text,
	"sanmar_customer_id" varchar,
	"sanmar_username" varchar,
	"sanmar_password" text,
	"slack_bot_token" text,
	"slack_channel_id" varchar,
	"hubspot_api_key" text,
	"sage_acct_id" varchar,
	"sage_login_id" varchar,
	"sage_api_key" text,
	"geoapify_api_key" text,
	"email_provider" varchar,
	"smtp_host" varchar,
	"smtp_port" integer,
	"smtp_user" varchar,
	"smtp_password" text,
	"email_from_address" varchar,
	"email_from_name" varchar,
	"email_reply_to" varchar,
	"quickbooks_connected" boolean DEFAULT false,
	"stripe_connected" boolean DEFAULT false,
	"shipmate_connected" boolean DEFAULT false,
	"qb_realm_id" varchar,
	"qb_access_token" text,
	"qb_refresh_token" text,
	"qb_client_id" text,
	"qb_client_secret" text,
	"stripe_publishable_key" text,
	"stripe_secret_key" text,
	"stripe_webhook_secret" text,
	"taxjar_api_key" text,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_syncs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_type" varchar NOT NULL,
	"sync_type" varchar NOT NULL,
	"status" varchar NOT NULL,
	"records_processed" integer DEFAULT 0,
	"error_message" text,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"invoice_number" varchar NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar DEFAULT 'pending',
	"due_date" timestamp,
	"qb_invoice_id" varchar,
	"qb_synced_at" timestamp,
	"stripe_payment_intent_id" varchar,
	"stripe_invoice_id" varchar,
	"stripe_invoice_url" text,
	"stripe_invoice_pdf_url" text,
	"payment_method" varchar,
	"payment_reference" varchar,
	"notes" text,
	"sent_at" timestamp,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_frequency_days" integer,
	"next_reminder_date" timestamp,
	"last_reminder_sent_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"payment_reference" varchar,
	"status" varchar DEFAULT 'pending',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"company" varchar,
	"title" varchar,
	"source" varchar DEFAULT 'website' NOT NULL,
	"status" varchar DEFAULT 'new' NOT NULL,
	"score" integer,
	"estimated_value" numeric(12, 2),
	"notes" text,
	"last_contact_date" timestamp,
	"next_follow_up_date" timestamp,
	"converted_to_contact_id" varchar,
	"converted_to_company_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_library" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cloudinary_public_id" varchar,
	"cloudinary_url" varchar NOT NULL,
	"cloudinary_resource_type" varchar,
	"file_name" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"file_extension" varchar,
	"thumbnail_url" varchar,
	"folder" varchar DEFAULT 'general',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"category" varchar,
	"order_id" varchar,
	"company_id" varchar,
	"order_item_id" varchar,
	"source_table" varchar,
	"source_id" varchar,
	"uploaded_by" varchar,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_type" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"ai_draft_content" text,
	"scheduled_for" timestamp,
	"assigned_to" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"category" varchar,
	"tags" jsonb,
	"access_level" varchar DEFAULT 'all',
	"last_updated" timestamp DEFAULT now(),
	"created_by" varchar,
	"search_vector" text,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_sequences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"target_audience" varchar,
	"is_active" boolean DEFAULT true,
	"steps" jsonb,
	"ai_generated" boolean DEFAULT false,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"headline" varchar NOT NULL,
	"summary" text,
	"source_url" varchar,
	"sentiment" varchar,
	"relevance_score" integer,
	"alerts_sent" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar,
	"subscriber_id" varchar,
	"event_type" varchar NOT NULL,
	"event_data" jsonb,
	"user_agent" varchar,
	"ip_address" varchar,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_automations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"trigger" varchar NOT NULL,
	"trigger_data" jsonb,
	"workflow" jsonb,
	"is_active" boolean DEFAULT true,
	"total_triggered" integer DEFAULT 0,
	"list_id" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"preview_text" varchar,
	"from_name" varchar NOT NULL,
	"from_email" varchar NOT NULL,
	"reply_to" varchar,
	"html_content" text,
	"status" varchar DEFAULT 'draft',
	"type" varchar DEFAULT 'regular',
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"list_id" varchar,
	"template_id" varchar,
	"total_sent" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"opens" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"unsubscribes" integer DEFAULT 0,
	"bounces" integer DEFAULT 0,
	"ab_test_settings" jsonb,
	"automation_rules" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"title" varchar,
	"description" text,
	"form_fields" jsonb,
	"form_settings" jsonb,
	"embed_code" text,
	"is_active" boolean DEFAULT true,
	"conversions" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"list_id" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_lists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"subscriber_count" integer DEFAULT 0,
	"segment_rules" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"status" varchar DEFAULT 'active',
	"source" varchar,
	"tags" jsonb,
	"custom_fields" jsonb,
	"subscription_date" timestamp DEFAULT now(),
	"unsubscribe_date" timestamp,
	"last_email_sent" timestamp,
	"engagement_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"subject" varchar,
	"preview_text" varchar,
	"html_content" text,
	"design_data" jsonb,
	"thumbnail_url" varchar,
	"category" varchar,
	"is_public" boolean DEFAULT false,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" varchar NOT NULL,
	"sender_id" varchar,
	"order_id" varchar,
	"activity_id" varchar,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" varchar NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"mentioned_users" jsonb,
	"is_system_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_additional_charges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" varchar NOT NULL,
	"description" varchar NOT NULL,
	"charge_type" varchar DEFAULT 'flat',
	"amount" numeric(10, 2) NOT NULL,
	"is_vendor_charge" boolean DEFAULT false,
	"display_to_client" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_item_lines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" varchar NOT NULL,
	"size" varchar,
	"color" varchar,
	"quantity" integer DEFAULT 0 NOT NULL,
	"cost" numeric(10, 2),
	"unit_price" numeric(10, 2),
	"total_price" numeric(12, 2),
	"margin" numeric(5, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"product_id" varchar,
	"supplier_id" varchar,
	"quantity" integer NOT NULL,
	"cost" numeric(10, 2),
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"decoration_cost" numeric(10, 2),
	"charges" numeric(10, 2),
	"size_pricing" jsonb,
	"uom_factory" integer,
	"color" varchar,
	"size" varchar,
	"imprint_location" varchar,
	"imprint_method" varchar,
	"decorator_type" varchar,
	"price_label" varchar,
	"personal_comment" text,
	"private_notes" text,
	"notes" text,
	"shipping_destination" varchar,
	"shipping_account_type" varchar,
	"shipping_method_override" varchar,
	"shipping_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_service_charges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"charge_type" varchar NOT NULL,
	"description" varchar NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"taxable" boolean DEFAULT false,
	"include_in_margin" boolean DEFAULT false,
	"display_to_client" boolean DEFAULT true,
	"vendor_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar NOT NULL,
	"company_id" varchar,
	"contact_id" varchar,
	"assigned_user_id" varchar,
	"csr_user_id" varchar,
	"status" "order_status" DEFAULT 'quote',
	"order_type" varchar DEFAULT 'quote',
	"subtotal" numeric(12, 2) DEFAULT '0',
	"tax" numeric(12, 2) DEFAULT '0',
	"shipping" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) DEFAULT '0',
	"margin" numeric(5, 2) DEFAULT '0',
	"in_hands_date" timestamp,
	"event_date" timestamp,
	"supplier_in_hands_date" timestamp,
	"is_firm" boolean DEFAULT false,
	"is_rush" boolean DEFAULT false,
	"next_action_date" timestamp,
	"next_action_type" varchar,
	"next_action_notes" text,
	"customer_po" varchar,
	"payment_terms" varchar DEFAULT 'Net 30',
	"currency" varchar DEFAULT 'USD',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"quote_introduction" text,
	"order_discount" numeric(12, 2) DEFAULT '0',
	"project_name" varchar,
	"budget" numeric(12, 2),
	"notes" text,
	"customer_notes" text,
	"internal_notes" text,
	"supplier_notes" text,
	"additional_information" text,
	"shipping_address" text,
	"billing_address" text,
	"tracking_number" varchar,
	"shipping_method" varchar,
	"qb_invoice_id" varchar,
	"stripe_payment_intent_id" varchar,
	"tax_calculated_at" timestamp,
	"current_stage" varchar DEFAULT 'created' NOT NULL,
	"stages_completed" jsonb DEFAULT '["created"]'::jsonb NOT NULL,
	"stage_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"custom_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"presentation_status" varchar DEFAULT 'open',
	"sales_order_status" varchar DEFAULT 'new',
	"quote_status" varchar DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "order_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"order_item_id" varchar,
	"file_name" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"file_path" varchar NOT NULL,
	"thumbnail_path" varchar,
	"file_type" varchar DEFAULT 'document' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"uploaded_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_portal_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"token" varchar(255) NOT NULL,
	"client_email" varchar,
	"client_name" varchar,
	"is_active" boolean DEFAULT true,
	"access_count" integer DEFAULT 0,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"token_type" varchar DEFAULT 'order_tracking',
	CONSTRAINT "customer_portal_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "presentation_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"presentation_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"file_path" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "presentation_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"presentation_id" varchar NOT NULL,
	"product_id" varchar,
	"product_name" varchar NOT NULL,
	"suggested_price" numeric(10, 2),
	"suggested_quantity" integer,
	"reasoning" text,
	"is_included" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "presentations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"deal_notes" text,
	"hubspot_deal_id" varchar,
	"suggested_products" jsonb DEFAULT '[]'::jsonb,
	"slides" jsonb DEFAULT '[]'::jsonb,
	"status" varchar DEFAULT 'draft',
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar,
	"category_id" varchar,
	"name" varchar NOT NULL,
	"description" text,
	"sku" varchar,
	"supplier_sku" varchar,
	"base_price" numeric(10, 2),
	"minimum_quantity" integer DEFAULT 1,
	"brand" varchar,
	"category" varchar,
	"colors" text[],
	"sizes" text[],
	"imprint_methods" text,
	"lead_time" integer,
	"image_url" varchar,
	"product_type" varchar DEFAULT 'apparel',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "next_action_types" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"order" integer NOT NULL,
	"color" varchar DEFAULT 'bg-gray-100 text-gray-800' NOT NULL,
	"icon" varchar DEFAULT 'ClipboardList' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" varchar NOT NULL,
	"assigned_to" varchar NOT NULL,
	"notification_date" timestamp NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_stages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"order" integer NOT NULL,
	"color" varchar DEFAULT 'bg-gray-100 text-gray-800' NOT NULL,
	"icon" varchar DEFAULT 'Package' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"current_stage_id" varchar,
	"assigned_to" varchar,
	"next_action_date" timestamp,
	"next_action_notes" text,
	"completed_stages" jsonb DEFAULT '[]'::jsonb,
	"priority" varchar DEFAULT 'medium',
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sage_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sage_id" varchar NOT NULL,
	"product_name" varchar NOT NULL,
	"product_number" varchar,
	"supplier_id" varchar,
	"category" varchar,
	"subcategory" varchar,
	"brand" varchar,
	"description" text,
	"features" text[],
	"materials" text[],
	"dimensions" varchar,
	"weight" numeric(10, 4),
	"eqp_level" varchar,
	"pricing_structure" jsonb,
	"quantity_breaks" jsonb,
	"setup_charges" jsonb,
	"decoration_methods" text[],
	"lead_times" jsonb,
	"image_gallery" text[],
	"technical_drawings" text[],
	"compliance_certifications" text[],
	"last_synced_at" timestamp DEFAULT now(),
	"sync_status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sage_products_sage_id_unique" UNIQUE("sage_id")
);
--> statement-breakpoint
CREATE TABLE "product_search_index" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system" varchar NOT NULL,
	"source_product_id" varchar NOT NULL,
	"product_name" varchar NOT NULL,
	"category" varchar,
	"subcategory" varchar,
	"supplier_id" varchar,
	"supplier_name" varchar,
	"asi_number" varchar,
	"description" text,
	"key_terms" text[],
	"min_price" numeric,
	"max_price" numeric,
	"min_quantity" integer,
	"decoration_methods" text[],
	"colors" text[],
	"primary_image" varchar,
	"quality_score" numeric,
	"popularity_score" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"search_rank" integer DEFAULT 0,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "sequence_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" varchar NOT NULL,
	"date" varchar NOT NULL,
	"total_enrollments" integer DEFAULT 0,
	"total_sent" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_clicked" integer DEFAULT 0,
	"total_replied" integer DEFAULT 0,
	"total_bounced" integer DEFAULT 0,
	"total_meetings_booked" integer DEFAULT 0,
	"total_deals_created" integer DEFAULT 0,
	"total_revenue" numeric(10, 2) DEFAULT '0.00'
);
--> statement-breakpoint
CREATE TABLE "sequence_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" varchar NOT NULL,
	"contact_id" varchar NOT NULL,
	"contact_type" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"enrolled_by" varchar NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"unenrolled_at" timestamp,
	"unenroll_reason" varchar
);
--> statement-breakpoint
CREATE TABLE "sequence_step_executions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"step_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"executed_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"replied_at" timestamp,
	"bounced" boolean DEFAULT false,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "sequence_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"position" integer NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"delay_days" integer DEFAULT 1 NOT NULL,
	"delay_hours" integer DEFAULT 0 NOT NULL,
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"settings" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sequence_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"industry_type" varchar,
	"steps" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"automation" integer DEFAULT 100 NOT NULL,
	"unenroll_criteria" text,
	"settings" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_toggles" jsonb DEFAULT '{}'::jsonb,
	"timezone" varchar DEFAULT 'America/New_York',
	"currency" varchar DEFAULT 'USD',
	"date_format" varchar DEFAULT 'MM/DD/YYYY',
	"default_margin" numeric(5, 2) DEFAULT '30',
	"minimum_margin" numeric(5, 2) DEFAULT '15',
	"max_order_value" numeric(12, 2) DEFAULT '50000',
	"require_approval_over" numeric(12, 2) DEFAULT '5000',
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_branding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo_url" text,
	"logo_size" varchar DEFAULT 'medium',
	"logo_position" varchar DEFAULT 'left',
	"favicon_url" text,
	"company_name" varchar,
	"tagline" text,
	"primary_color" varchar DEFAULT '#3b82f6',
	"secondary_color" varchar DEFAULT '#64748b',
	"accent_color" varchar DEFAULT '#10b981',
	"background_color" varchar DEFAULT '#ffffff',
	"text_color" varchar DEFAULT '#1f2937',
	"sidebar_background_color" varchar DEFAULT '#014559',
	"sidebar_text_color" varchar DEFAULT '#ffffff',
	"sidebar_border_color" varchar DEFAULT '#374151',
	"nav_hover_color" varchar DEFAULT '#374151',
	"nav_active_color" varchar DEFAULT '#3b82f6',
	"nav_text_color" varchar DEFAULT '#d1d5db',
	"nav_text_active_color" varchar DEFAULT '#ffffff',
	"border_color" varchar DEFAULT '#e5e7eb',
	"border_radius" varchar DEFAULT 'medium',
	"font_family" varchar DEFAULT 'inter',
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_email_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"smtp_host" varchar,
	"smtp_port" integer,
	"smtp_user" varchar,
	"smtp_password" text,
	"imap_host" varchar,
	"imap_port" integer,
	"imap_user" varchar,
	"imap_password" text,
	"is_primary" boolean DEFAULT false,
	"use_default_for_compose" boolean DEFAULT false,
	"hide_name_on_send" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_shipments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"carrier" varchar,
	"shipping_method" varchar,
	"tracking_number" varchar,
	"shipping_cost" numeric(10, 2),
	"ship_date" timestamp,
	"estimated_delivery" timestamp,
	"actual_delivery" timestamp,
	"ship_to_address" text,
	"ship_to_name" varchar,
	"ship_to_company" varchar,
	"ship_to_phone" varchar,
	"status" varchar DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ss_activewear_import_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"total_products" integer DEFAULT 0,
	"processed_products" integer DEFAULT 0,
	"new_products" integer DEFAULT 0,
	"updated_products" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ss_activewear_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"gtin" varchar,
	"style_id" integer,
	"brand_name" varchar,
	"style_name" varchar,
	"color_name" varchar,
	"color_code" varchar,
	"size_name" varchar,
	"size_code" varchar,
	"unit_weight" numeric(10, 4),
	"case_qty" integer,
	"piece_price" numeric(10, 2),
	"dozen_price" numeric(10, 2),
	"case_price" numeric(10, 2),
	"customer_price" numeric(10, 2),
	"qty" integer DEFAULT 0,
	"color_front_image" varchar,
	"color_back_image" varchar,
	"color_side_image" varchar,
	"color_swatch_image" varchar,
	"country_of_origin" varchar,
	"is_active" boolean DEFAULT true,
	"last_synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ss_activewear_products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "supplier_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"address_name" varchar,
	"company_name_on_docs" varchar,
	"street" text,
	"street2" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"country" varchar DEFAULT 'US',
	"address_type" varchar DEFAULT 'both' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"website" varchar,
	"contact_person" varchar,
	"payment_terms" varchar,
	"notes" text,
	"is_preferred" boolean DEFAULT false,
	"do_not_order" boolean DEFAULT false,
	"ytd_spend" numeric(12, 2) DEFAULT '0',
	"last_year_spend" numeric(12, 2) DEFAULT '0',
	"product_count" integer DEFAULT 0,
	"preferred_benefits" jsonb,
	"vendor_offers" jsonb,
	"auto_notifications" boolean DEFAULT true,
	"last_order_date" timestamp,
	"order_confirmation_reminder" boolean DEFAULT true,
	"esp_id" varchar,
	"asi_id" varchar,
	"sage_id" varchar,
	"distributor_central_id" varchar,
	"api_integration_status" varchar,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar DEFAULT 'user' NOT NULL,
	"token" varchar NOT NULL,
	"invited_by" varchar,
	"accepted_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"username" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'user',
	"auth_provider" varchar DEFAULT 'local',
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"email_reports_enabled" boolean DEFAULT true,
	"last_email_report_sent" timestamp,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" varchar,
	"two_factor_backup_codes" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vendor_approval_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"product_id" varchar,
	"order_id" varchar,
	"requested_by" varchar NOT NULL,
	"reason" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar,
	"order_id" varchar,
	"document_id" varchar,
	"invoice_number" varchar NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" varchar DEFAULT 'pending',
	"qb_bill_id" varchar,
	"received_date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_report_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"data_source" varchar NOT NULL,
	"calculation_method" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_report_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"report_week_start" timestamp NOT NULL,
	"report_week_end" timestamp NOT NULL,
	"metrics_data" jsonb NOT NULL,
	"email_sent_at" timestamp,
	"email_status" varchar DEFAULT 'pending',
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_artwork_file_id_artwork_files_id_fk" FOREIGN KEY ("artwork_file_id") REFERENCES "public"."artwork_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_artwork_item_id_artwork_items_id_fk" FOREIGN KEY ("artwork_item_id") REFERENCES "public"."artwork_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_files" ADD CONSTRAINT "artwork_files_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_files" ADD CONSTRAINT "artwork_files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_files" ADD CONSTRAINT "artwork_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_items" ADD CONSTRAINT "artwork_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_cards" ADD CONSTRAINT "artwork_cards_column_id_artwork_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."artwork_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_cards" ADD CONSTRAINT "artwork_cards_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_cards" ADD CONSTRAINT "artwork_cards_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_cards" ADD CONSTRAINT "artwork_cards_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_communication_id_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_metrics" ADD CONSTRAINT "kpi_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_uploads" ADD CONSTRAINT "data_uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_central_products" ADD CONSTRAINT "distributor_central_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_confirmations" ADD CONSTRAINT "po_confirmations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_confirmations" ADD CONSTRAINT "po_confirmations_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_approvals" ADD CONSTRAINT "quote_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "errors" ADD CONSTRAINT "errors_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "errors" ADD CONSTRAINT "errors_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "errors" ADD CONSTRAINT "errors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esp_products" ADD CONSTRAINT "esp_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_sequences" ADD CONSTRAINT "marketing_sequences_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_analytics" ADD CONSTRAINT "newsletter_analytics_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_analytics" ADD CONSTRAINT "newsletter_analytics_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_automations" ADD CONSTRAINT "newsletter_automations_list_id_newsletter_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."newsletter_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_automations" ADD CONSTRAINT "newsletter_automations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_list_id_newsletter_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."newsletter_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_template_id_newsletter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."newsletter_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_forms" ADD CONSTRAINT "newsletter_forms_list_id_newsletter_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."newsletter_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_forms" ADD CONSTRAINT "newsletter_forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_lists" ADD CONSTRAINT "newsletter_lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_templates" ADD CONSTRAINT "newsletter_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_activity_id_project_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."project_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD CONSTRAINT "order_additional_charges_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_lines" ADD CONSTRAINT "order_item_lines_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_service_charges" ADD CONSTRAINT "order_service_charges_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_service_charges" ADD CONSTRAINT "order_service_charges_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_csr_user_id_users_id_fk" FOREIGN KEY ("csr_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_files" ADD CONSTRAINT "presentation_files_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_products" ADD CONSTRAINT "presentation_products_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_products" ADD CONSTRAINT "presentation_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_notifications" ADD CONSTRAINT "production_notifications_tracking_id_production_tracking_id_fk" FOREIGN KEY ("tracking_id") REFERENCES "public"."production_tracking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_tracking" ADD CONSTRAINT "production_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_tracking" ADD CONSTRAINT "production_tracking_current_stage_id_production_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."production_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sage_products" ADD CONSTRAINT "sage_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_analytics" ADD CONSTRAINT "sequence_analytics_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_step_executions" ADD CONSTRAINT "sequence_step_executions_enrollment_id_sequence_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_step_executions" ADD CONSTRAINT "sequence_step_executions_step_id_sequence_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."sequence_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_branding" ADD CONSTRAINT "system_branding_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_settings" ADD CONSTRAINT "user_email_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_addresses" ADD CONSTRAINT "supplier_addresses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_library_folder" ON "media_library" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "idx_media_library_category" ON "media_library" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_media_library_company" ON "media_library" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_media_library_order" ON "media_library" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_media_library_uploaded_by" ON "media_library" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_library_created_at" ON "media_library" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");