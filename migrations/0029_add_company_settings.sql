CREATE TABLE IF NOT EXISTS "company_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "feature_toggles" jsonb DEFAULT '{}'::jsonb,
  "timezone" varchar DEFAULT 'America/New_York',
  "currency" varchar DEFAULT 'USD',
  "date_format" varchar DEFAULT 'MM/DD/YYYY',
  "default_margin" numeric(5,2) DEFAULT '30',
  "minimum_margin" numeric(5,2) DEFAULT '15',
  "max_order_value" numeric(12,2) DEFAULT '50000',
  "require_approval_over" numeric(12,2) DEFAULT '5000',
  "updated_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
