CREATE TABLE "search_embeddings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"content_hash" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_name" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "image_url" varchar;