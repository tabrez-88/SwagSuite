ALTER TABLE "contacts" ADD COLUMN "receive_order_emails" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "sidebar_background_color" varchar DEFAULT '#014559';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "sidebar_text_color" varchar DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "sidebar_border_color" varchar DEFAULT '#374151';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "nav_hover_color" varchar DEFAULT '#374151';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "nav_active_color" varchar DEFAULT '#3b82f6';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "nav_text_color" varchar DEFAULT '#d1d5db';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "nav_text_active_color" varchar DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "system_branding" ADD COLUMN "border_color" varchar DEFAULT '#e5e7eb';