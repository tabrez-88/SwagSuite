-- Add order_files table for managing order-related files
CREATE TABLE IF NOT EXISTS "order_files" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" varchar NOT NULL,
  "order_item_id" varchar,
  "file_name" varchar NOT NULL,
  "original_name" varchar NOT NULL,
  "file_size" integer,
  "mime_type" varchar,
  "file_path" varchar NOT NULL,
  "thumbnail_path" varchar,
  "file_type" varchar DEFAULT 'document' NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "uploaded_by" varchar,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add foreign keys
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_id_orders_id_fk" 
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_item_id_order_items_id_fk" 
  FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "order_files" ADD CONSTRAINT "order_files_uploaded_by_users_id_fk" 
  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX IF NOT EXISTS "order_files_order_id_idx" ON "order_files" ("order_id");
CREATE INDEX IF NOT EXISTS "order_files_order_item_id_idx" ON "order_files" ("order_item_id");
CREATE INDEX IF NOT EXISTS "order_files_file_type_idx" ON "order_files" ("file_type");
CREATE INDEX IF NOT EXISTS "order_files_created_at_idx" ON "order_files" ("created_at");
