-- Add email configuration columns to integration_settings table
ALTER TABLE "integration_settings" ADD COLUMN "email_provider" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_host" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_port" integer;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_user" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_password" text;
ALTER TABLE "integration_settings" ADD COLUMN "email_from_address" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "email_from_name" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "email_reply_to" varchar;
