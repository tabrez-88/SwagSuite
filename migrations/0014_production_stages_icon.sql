-- Add icon column to production_stages table
ALTER TABLE "production_stages" ADD COLUMN IF NOT EXISTS "icon" varchar NOT NULL DEFAULT 'Package';

-- Change id column from uuid default to varchar (we use slug-based ids like 'sales-booked')
-- Drop the default since we'll provide explicit IDs
ALTER TABLE "production_stages" ALTER COLUMN "id" DROP DEFAULT;
