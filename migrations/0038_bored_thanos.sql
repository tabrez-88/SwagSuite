CREATE TABLE "purchase_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" varchar NOT NULL,
	"order_item_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"po_number" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_role" varchar DEFAULT 'supplier' NOT NULL,
	"group_key" varchar NOT NULL,
	"current_stage_id" varchar,
	"document_id" varchar,
	"confirmation_token" varchar,
	"confirmation_token_expires_at" timestamp,
	"submitted_at" timestamp,
	"confirmed_at" timestamp,
	"shipped_at" timestamp,
	"billed_at" timestamp,
	"closed_at" timestamp,
	"vendor_notes" text,
	"internal_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_current_stage_id_production_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."production_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_document_id_generated_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."generated_documents"("id") ON DELETE no action ON UPDATE no action;