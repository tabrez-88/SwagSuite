CREATE TABLE "decorator_matrices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"decoration_method" varchar(100) NOT NULL,
	"is_default" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "decorator_matrix_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" varchar NOT NULL,
	"min_quantity" integer NOT NULL,
	"max_quantity" integer,
	"color_count" integer DEFAULT 1,
	"setup_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"run_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"additional_color_cost" numeric(10, 2) DEFAULT '0',
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "decorator_matrices" ADD CONSTRAINT "decorator_matrices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decorator_matrix_entries" ADD CONSTRAINT "decorator_matrix_entries_matrix_id_decorator_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."decorator_matrices"("id") ON DELETE cascade ON UPDATE no action;