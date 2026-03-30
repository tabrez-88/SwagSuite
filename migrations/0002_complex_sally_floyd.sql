ALTER TABLE "order_additional_charges" ADD COLUMN "charge_category" varchar DEFAULT 'fixed';--> statement-breakpoint
ALTER TABLE "order_additional_charges" ADD COLUMN "include_in_unit_price" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "description" text;