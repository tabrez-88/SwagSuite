CREATE TABLE "quote_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"document_id" varchar,
	"approval_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"client_email" varchar(255),
	"client_name" varchar(255),
	"quote_total" numeric(12, 2),
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"approved_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"approval_notes" text,
	"pdf_path" varchar(500),
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quote_approvals_approval_token_unique" UNIQUE("approval_token")
);
--> statement-breakpoint
ALTER TABLE "quote_approvals" ADD CONSTRAINT "quote_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;