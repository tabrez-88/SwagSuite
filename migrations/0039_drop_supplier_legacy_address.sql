-- Drop legacy single-text address column from suppliers (replaced by supplier_addresses table)
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "address";
