CREATE TABLE "artwork_item_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artwork_item_id" varchar NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"sort_order" integer DEFAULT 0,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "artwork_item_files" ADD CONSTRAINT "artwork_item_files_artwork_item_id_artwork_items_id_fk" FOREIGN KEY ("artwork_item_id") REFERENCES "public"."artwork_items"("id") ON DELETE cascade ON UPDATE no action;