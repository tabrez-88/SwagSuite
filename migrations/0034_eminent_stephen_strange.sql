ALTER TABLE "invoices" ADD COLUMN "invoice_type" varchar DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "deposit_deduction" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deposit_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deposit_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deposit_status" varchar;