CREATE TABLE "order_files" (
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
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
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
--> statement-breakpoint
ALTER TABLE "artwork_approvals" ALTER COLUMN "client_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "shipping_address" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "decoration_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "charges" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" varchar DEFAULT 'local';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");