-- Drop legacy address columns from contacts (now managed via company_addresses table)
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "billing_address";
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "shipping_address";

-- Drop legacy address columns from companies (now managed via company_addresses table)
ALTER TABLE "companies" DROP COLUMN IF EXISTS "address";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "city";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "state";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "zip_code";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "country";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "billing_address";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "shipping_addresses";
