-- Company Addresses table (CommonSKU-style: separate entity per company)
CREATE TABLE IF NOT EXISTS "company_addresses" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" varchar NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS "idx_company_addresses_company_id" ON "company_addresses"("company_id");

-- Contact enhancements (CommonSKU-style)
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "department" varchar;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]';
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "mailing_address" text;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "no_marketing" boolean DEFAULT false;
