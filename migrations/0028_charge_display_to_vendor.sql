-- Add `display_to_vendor` flag to per-item charges and order-level service charges (CommonSKU pattern).
-- Mirrors `display_to_client`. Default true so existing rows show on vendor PO PDF until explicitly hidden.
-- Driven by Sales Orders #27 client comment: setup + shipping charges must appear on vendor PO PDF.

ALTER TABLE order_additional_charges
  ADD COLUMN IF NOT EXISTS display_to_vendor boolean DEFAULT true;

UPDATE order_additional_charges
  SET display_to_vendor = true
  WHERE display_to_vendor IS NULL;

ALTER TABLE order_service_charges
  ADD COLUMN IF NOT EXISTS display_to_vendor boolean DEFAULT true;

UPDATE order_service_charges
  SET display_to_vendor = true
  WHERE display_to_vendor IS NULL;
