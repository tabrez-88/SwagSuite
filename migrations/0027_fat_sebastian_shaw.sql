ALTER TABLE "artwork_items" ADD COLUMN "number_of_colors" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "size_surcharges" jsonb;