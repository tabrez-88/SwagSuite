CREATE TABLE "imprint_option_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"label" varchar NOT NULL,
	"normalized_label" varchar NOT NULL,
	"suggested_by" varchar,
	"suggested_from_order_id" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"approved_option_id" varchar,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "imprint_options" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"value" varchar NOT NULL,
	"label" varchar NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "imprint_option_suggestions" ADD CONSTRAINT "imprint_option_suggestions_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imprint_option_suggestions" ADD CONSTRAINT "imprint_option_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imprint_option_suggestions" ADD CONSTRAINT "imprint_option_suggestions_approved_option_id_imprint_options_id_fk" FOREIGN KEY ("approved_option_id") REFERENCES "public"."imprint_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "imprint_options_type_value_unique" ON "imprint_options" USING btree ("type","value");