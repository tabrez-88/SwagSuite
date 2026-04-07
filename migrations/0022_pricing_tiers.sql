-- Add supplier quantity break pricing tiers to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pricing_tiers" jsonb;
