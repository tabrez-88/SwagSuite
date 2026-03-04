CREATE TABLE "media_library" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cloudinary_public_id" varchar,
	"cloudinary_url" varchar NOT NULL,
	"cloudinary_resource_type" varchar,
	"file_name" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"file_extension" varchar,
	"thumbnail_url" varchar,
	"folder" varchar DEFAULT 'general',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"category" varchar,
	"order_id" varchar,
	"company_id" varchar,
	"order_item_id" varchar,
	"source_table" varchar,
	"source_id" varchar,
	"uploaded_by" varchar,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_library_folder" ON "media_library" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "idx_media_library_category" ON "media_library" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_media_library_company" ON "media_library" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_media_library_order" ON "media_library" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_media_library_uploaded_by" ON "media_library" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_library_created_at" ON "media_library" USING btree ("created_at");