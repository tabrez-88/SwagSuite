-- Next action types table (customizable PO follow-up actions)
CREATE TABLE IF NOT EXISTS "next_action_types" (
  "id" varchar PRIMARY KEY,
  "name" varchar NOT NULL,
  "description" varchar,
  "order" integer NOT NULL,
  "color" varchar NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  "icon" varchar NOT NULL DEFAULT 'ClipboardList',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add next_action_type column to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "next_action_type" varchar;
