-- Supplier Addresses (CommonSKU-style: separate entity per supplier)
CREATE TABLE IF NOT EXISTS "supplier_addresses" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL REFERENCES "suppliers"("id") ON DELETE CASCADE,
  "address_name" varchar,
  "company_name_on_docs" varchar,
  "street" text,
  "street2" text,
  "city" varchar,
  "state" varchar,
  "zip_code" varchar,
  "country" varchar DEFAULT 'US',
  "address_type" varchar NOT NULL DEFAULT 'both',
  "is_default" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Migrate existing address text to supplier_addresses for suppliers that have one
INSERT INTO "supplier_addresses" ("supplier_id", "address_name", "street", "address_type", "is_default")
SELECT "id", 'Main', "address", 'both', true
FROM "suppliers"
WHERE "address" IS NOT NULL AND "address" != '';
