-- Remove unused tags column from contacts
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "tags";
