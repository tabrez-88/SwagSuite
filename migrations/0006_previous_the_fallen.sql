ALTER TABLE "order_items" ADD COLUMN "ship_to_address_id" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "ship_to_address" jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "ship_in_hands_date" timestamp;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "ship_firm" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "shipping_quote" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_ship_to" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_address_id" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_address" jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_in_hands_date" timestamp;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_firm" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_shipping_method" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_shipping_account_type" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_shipping_quote" numeric(10, 2);