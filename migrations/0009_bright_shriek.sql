CREATE TABLE "system_branding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo_url" text,
	"logo_size" varchar DEFAULT 'medium',
	"logo_position" varchar DEFAULT 'left',
	"favicon_url" text,
	"company_name" varchar,
	"tagline" text,
	"primary_color" varchar DEFAULT '#3b82f6',
	"secondary_color" varchar DEFAULT '#64748b',
	"accent_color" varchar DEFAULT '#10b981',
	"background_color" varchar DEFAULT '#ffffff',
	"text_color" varchar DEFAULT '#1f2937',
	"border_radius" varchar DEFAULT 'medium',
	"font_family" varchar DEFAULT 'inter',
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "system_branding" ADD CONSTRAINT "system_branding_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;