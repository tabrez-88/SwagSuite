-- Add document_id column to vendor_invoices for PO vouching
ALTER TABLE "vendor_invoices" ADD COLUMN IF NOT EXISTS "document_id" varchar;
