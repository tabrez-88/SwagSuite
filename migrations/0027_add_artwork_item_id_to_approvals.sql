-- Add artwork_item_id column to artwork_approvals for per-artwork proof approval tracking
ALTER TABLE "artwork_approvals" ADD COLUMN "artwork_item_id" varchar REFERENCES "artwork_items"("id");
