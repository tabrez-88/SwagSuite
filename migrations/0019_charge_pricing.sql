-- Add cost/price/margin fields to order_additional_charges for CommonSKU-style pricing
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "net_cost" decimal(10,4) DEFAULT '0';
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "retail_price" decimal(10,2);
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "margin" decimal(5,2);
ALTER TABLE "order_additional_charges" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1;

-- Backfill: set retailPrice from existing amount for all existing charges
UPDATE "order_additional_charges" SET "retail_price" = "amount" WHERE "retail_price" IS NULL;
