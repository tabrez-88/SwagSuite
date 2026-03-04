ALTER TABLE "orders" ADD COLUMN "presentation_status" varchar DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "sales_order_status" varchar DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimate_status" varchar DEFAULT 'draft';