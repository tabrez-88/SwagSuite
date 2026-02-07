-- Add colors field to sage_products table
ALTER TABLE "sage_products" ADD COLUMN IF NOT EXISTS "colors" text[];
