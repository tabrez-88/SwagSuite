-- Order-level service charges (Freight, Fulfillment, Shipping, Rush, Other, Custom)
CREATE TABLE IF NOT EXISTS "order_service_charges" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "charge_type" varchar NOT NULL,
  "description" varchar NOT NULL,
  "quantity" integer DEFAULT 1,
  "unit_cost" decimal(10, 2) NOT NULL DEFAULT 0,
  "unit_price" decimal(10, 2) NOT NULL DEFAULT 0,
  "taxable" boolean DEFAULT false,
  "include_in_margin" boolean DEFAULT false,
  "display_to_client" boolean DEFAULT true,
  "vendor_id" varchar REFERENCES "suppliers"("id"),
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Per-product shipping config fields on order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "shipping_destination" varchar;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "shipping_account_type" varchar;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "shipping_method_override" varchar;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "shipping_notes" text;
