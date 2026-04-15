-- Add number_of_colors to artwork_items (for correct decorator matrix charge calculation)
ALTER TABLE "artwork_items" ADD COLUMN IF NOT EXISTS "number_of_colors" integer DEFAULT 1;

-- Add size_surcharges to products (per-size cost adjustments like XL/2XL upcharges)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_surcharges" jsonb;
