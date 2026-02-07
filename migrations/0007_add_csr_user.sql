-- Add CSR (Customer Service Representative) user assignment to orders
ALTER TABLE "orders" ADD COLUMN "csr_user_id" varchar;
