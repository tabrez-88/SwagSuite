ALTER TABLE "customer_portal_tokens" ADD COLUMN "access_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customer_portal_tokens" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN "updated_at" timestamp DEFAULT now();