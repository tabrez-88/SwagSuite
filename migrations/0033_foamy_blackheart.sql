ALTER TABLE "artwork_charges" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN "sort_order" integer DEFAULT 0;