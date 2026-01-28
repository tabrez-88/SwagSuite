-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN "username" varchar;
ALTER TABLE "users" ADD COLUMN "password" varchar;
ALTER TABLE "users" ADD COLUMN "auth_provider" varchar DEFAULT 'local';
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;

-- Add unique constraint on username
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS "user_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar DEFAULT 'user' NOT NULL,
	"token" varchar NOT NULL,
	"invited_by" varchar,
	"accepted_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);

-- Create password_resets table
CREATE TABLE IF NOT EXISTS "password_resets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);

-- Add foreign key constraints
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "user_invitations_email_idx" ON "user_invitations" ("email");
CREATE INDEX IF NOT EXISTS "user_invitations_token_idx" ON "user_invitations" ("token");
CREATE INDEX IF NOT EXISTS "password_resets_user_id_idx" ON "password_resets" ("user_id");
CREATE INDEX IF NOT EXISTS "password_resets_token_idx" ON "password_resets" ("token");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
