CREATE TABLE "customer_portal_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"token" varchar(255) NOT NULL,
	"client_email" varchar,
	"client_name" varchar,
	"is_active" boolean DEFAULT true,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "customer_portal_tokens_token_unique" UNIQUE("token")
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
	"payment_method" varchar,
	"payment_reference" varchar,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "order_additional_charges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" varchar NOT NULL,
	"description" varchar NOT NULL,
	"charge_type" varchar DEFAULT 'flat',
	"amount" numeric(10, 2) NOT NULL,
	"is_vendor_charge" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
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
CREATE TABLE "vendor_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar,
	"order_id" varchar,
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
ALTER TABLE "production_stages" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "qb_customer_id" varchar;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stripe_customer_id" varchar;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "tax_exempt" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "geoapify_api_key" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "qb_realm_id" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "qb_access_token" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "qb_refresh_token" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "qb_client_id" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "qb_client_secret" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "stripe_publishable_key" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "stripe_secret_key" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "stripe_webhook_secret" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "taxjar_api_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_rush" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "next_action_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "next_action_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "qb_invoice_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_payment_intent_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_calculated_at" timestamp;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "icon" varchar DEFAULT 'Package' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD CONSTRAINT "order_additional_charges_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_lines" ADD CONSTRAINT "order_item_lines_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_settings" ADD CONSTRAINT "user_email_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;