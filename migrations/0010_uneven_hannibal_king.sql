CREATE TABLE "tax_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar NOT NULL,
	"description" text,
	"rate" numeric(5, 3) DEFAULT '0' NOT NULL,
	"taxjar_product_code" varchar,
	"is_exempt" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "default_tax_code_id" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "tax_origin_street" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "tax_origin_city" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "tax_origin_state" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "tax_origin_zip" varchar;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "tax_origin_country" varchar DEFAULT 'US';--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "tax_code_id" varchar;--> statement-breakpoint
ALTER TABLE "order_service_charges" ADD COLUMN "tax_code_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "default_tax_code_id" varchar;