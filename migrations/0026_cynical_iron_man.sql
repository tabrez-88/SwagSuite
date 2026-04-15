ALTER TABLE "orders" ALTER COLUMN "payment_terms" SET DEFAULT 'Credit Card';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "goodsync_folder_url" varchar;--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "net_cost" numeric(10, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "retail_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "margin" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "display_to_vendor" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "order_service_charges" ADD COLUMN IF NOT EXISTS "display_to_vendor" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pricing_tiers" jsonb;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "order_number_prefix" varchar DEFAULT '';--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "order_number_digits" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb DEFAULT '{"mentions":{"inApp":true,"email":false,"slack":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commission_percent" numeric(5, 2);