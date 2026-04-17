ALTER TABLE "email_templates" ADD COLUMN "body_html" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "body_json" jsonb;