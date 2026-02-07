-- Add uomFactory column to order_items
ALTER TABLE "order_items" ADD COLUMN "uom_factory" integer;

-- Create artwork_items table
CREATE TABLE IF NOT EXISTS "artwork_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"artwork_type" varchar(100),
	"location" varchar(255),
	"color" varchar(100),
	"size" varchar(100),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"file_name" varchar(500),
	"file_path" varchar(500),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE "artwork_items" ADD CONSTRAINT "artwork_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE no action ON UPDATE no action;
