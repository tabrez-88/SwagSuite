CREATE TABLE "vendor_approval_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"product_id" varchar,
	"order_id" varchar,
	"requested_by" varchar NOT NULL,
	"reason" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_approval_requests" ADD CONSTRAINT "vendor_approval_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;