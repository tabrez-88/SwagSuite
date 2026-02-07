CREATE TABLE "artwork_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"order_item_id" varchar,
	"artwork_file_id" varchar,
	"approval_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"client_email" varchar(255) NOT NULL,
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
ALTER TABLE "orders" DROP CONSTRAINT "orders_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "colors" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "sanmar_customer_id" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "sanmar_username" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "sanmar_password" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "email_provider" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "smtp_host" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "smtp_port" integer;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "smtp_user" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "smtp_password" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "email_from_address" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "email_from_name" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "email_reply_to" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "supplier_id" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "csr_user_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_po" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_terms" varchar DEFAULT 'Net 30';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_discount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" varchar;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_artwork_file_id_artwork_files_id_fk" FOREIGN KEY ("artwork_file_id") REFERENCES "public"."artwork_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_communication_id_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_csr_user_id_users_id_fk" FOREIGN KEY ("csr_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "supplier_id";