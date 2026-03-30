CREATE TABLE "artwork_charges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artwork_item_id" varchar NOT NULL,
	"charge_name" varchar(255) NOT NULL,
	"charge_category" varchar(20) DEFAULT 'run' NOT NULL,
	"net_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"margin" numeric(5, 2) DEFAULT '0',
	"retail_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"quantity" integer DEFAULT 1,
	"display_mode" varchar(30) DEFAULT 'display_to_client' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "artwork_items" ADD COLUMN "repeat_logo" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "decorator_id" varchar;--> statement-breakpoint
ALTER TABLE "artwork_charges" ADD CONSTRAINT "artwork_charges_artwork_item_id_artwork_items_id_fk" FOREIGN KEY ("artwork_item_id") REFERENCES "public"."artwork_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_decorator_id_suppliers_id_fk" FOREIGN KEY ("decorator_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;