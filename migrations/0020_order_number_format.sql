-- Add configurable order number format to company_settings
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "order_number_prefix" varchar DEFAULT 'ORD';
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "order_number_digits" integer DEFAULT 3;
