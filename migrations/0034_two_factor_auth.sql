ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "two_factor_secret" varchar;
ALTER TABLE "users" ADD COLUMN "two_factor_backup_codes" jsonb;
