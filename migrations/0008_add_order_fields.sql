-- Add missing order fields
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_po" varchar(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_terms" varchar(100) DEFAULT 'Net 30';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_discount" numeric(12,2) DEFAULT 0;
