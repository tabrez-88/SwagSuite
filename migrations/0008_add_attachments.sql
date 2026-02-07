-- Add attachments table for storing file metadata
CREATE TABLE IF NOT EXISTS "attachments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar REFERENCES "orders"("id") ON DELETE CASCADE,
  "communication_id" varchar REFERENCES "communications"("id") ON DELETE CASCADE,
  "filename" varchar NOT NULL,
  "original_filename" varchar NOT NULL,
  "storage_path" varchar NOT NULL,
  "mime_type" varchar,
  "file_size" integer,
  "category" varchar DEFAULT 'attachment',
  "uploaded_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_attachments_order_id" ON "attachments"("order_id");
CREATE INDEX IF NOT EXISTS "idx_attachments_communication_id" ON "attachments"("communication_id");
CREATE INDEX IF NOT EXISTS "idx_attachments_category" ON "attachments"("category");
