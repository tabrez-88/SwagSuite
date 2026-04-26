CREATE TABLE "shipping_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" varchar DEFAULT 'organization' NOT NULL,
	"owner_id" varchar,
	"account_name" varchar NOT NULL,
	"courier" varchar NOT NULL,
	"account_number" varchar NOT NULL,
	"billing_zip" varchar,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "ship_firm" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "leg2_firm" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "shipping_date" timestamp;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "shipping_account_id" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_shipping_date" timestamp;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "leg2_shipping_account_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ship_date" timestamp;--> statement-breakpoint
ALTER TABLE "shipping_accounts" ADD CONSTRAINT "shipping_accounts_owner_id_companies_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "order_items" SET "ship_firm" = NULL WHERE "ship_firm" = false;--> statement-breakpoint
UPDATE "order_items" SET "leg2_firm" = NULL WHERE "leg2_firm" = false;