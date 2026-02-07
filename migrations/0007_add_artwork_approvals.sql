-- Add artwork approvals table
CREATE TABLE IF NOT EXISTS "artwork_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"order_item_id" integer,
	"artwork_file_id" integer,
	"approval_token" varchar(255) NOT NULL UNIQUE,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"client_email" varchar(255) NOT NULL,
	"client_name" varchar(255),
	"sent_at" timestamp,
	"approved_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"pdf_path" varchar(500),
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "artwork_approvals" ADD CONSTRAINT "artwork_approvals_artwork_file_id_artwork_files_id_fk" FOREIGN KEY ("artwork_file_id") REFERENCES "artwork_files"("id") ON DELETE set null ON UPDATE no action;

-- Add indexes
CREATE INDEX IF NOT EXISTS "artwork_approvals_order_id_idx" ON "artwork_approvals" ("order_id");
CREATE INDEX IF NOT EXISTS "artwork_approvals_token_idx" ON "artwork_approvals" ("approval_token");
CREATE INDEX IF NOT EXISTS "artwork_approvals_status_idx" ON "artwork_approvals" ("status");
