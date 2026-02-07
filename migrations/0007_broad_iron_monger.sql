CREATE TABLE "artwork_items" (
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
--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"document_type" varchar NOT NULL,
	"document_number" varchar NOT NULL,
	"vendor_id" varchar,
	"vendor_name" varchar,
	"file_url" text,
	"file_name" varchar NOT NULL,
	"file_size" integer,
	"status" varchar DEFAULT 'draft',
	"generated_by" varchar,
	"sent_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "uom_factory" integer;--> statement-breakpoint
ALTER TABLE "artwork_items" ADD CONSTRAINT "artwork_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;