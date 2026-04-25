ALTER TABLE "production_stages" ADD COLUMN "is_initial" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "is_final" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "on_email_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "on_vendor_confirm" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "on_billing" boolean DEFAULT false;--> statement-breakpoint
-- Data migration: set flags on existing default stages
UPDATE "production_stages" SET "is_initial" = true WHERE "id" = 'created';--> statement-breakpoint
UPDATE "production_stages" SET "on_email_sent" = true WHERE "id" = 'submitted';--> statement-breakpoint
UPDATE "production_stages" SET "on_vendor_confirm" = true WHERE "id" = 'confirmed';--> statement-breakpoint
UPDATE "production_stages" SET "is_final" = true, "on_billing" = true WHERE "id" = 'billed';--> statement-breakpoint
UPDATE "production_stages" SET "is_final" = true WHERE "id" = 'closed';--> statement-breakpoint
-- For non-default DBs: set is_initial on lowest-order stage if no stage has it
UPDATE "production_stages" SET "is_initial" = true WHERE "id" = (
  SELECT "id" FROM "production_stages" WHERE "is_active" = true ORDER BY "order" ASC LIMIT 1
) AND NOT EXISTS (SELECT 1 FROM "production_stages" WHERE "is_initial" = true);