-- Add commission percentage to users for commission reporting (Paulina spec 3/10)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commission_percent" decimal(5,2);
