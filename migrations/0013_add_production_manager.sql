-- Add Production Manager assignment to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "production_manager_id" varchar REFERENCES "users"("id");
