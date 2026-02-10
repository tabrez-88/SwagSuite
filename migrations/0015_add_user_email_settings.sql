CREATE TABLE IF NOT EXISTS "user_email_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "smtp_host" varchar,
  "smtp_port" integer,
  "smtp_user" varchar,
  "smtp_password" text,
  "imap_host" varchar,
  "imap_port" integer,
  "imap_user" varchar,
  "imap_password" text,
  "is_primary" boolean DEFAULT false,
  "use_default_for_compose" boolean DEFAULT false,
  "hide_name_on_send" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX "idx_user_email_settings_user_id" ON "user_email_settings" ("user_id");
