CREATE TABLE IF NOT EXISTS "decorator_matrix_breakdowns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" varchar NOT NULL,
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"max_quantity" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decorator_matrix_cells" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" varchar NOT NULL,
	"row_id" varchar NOT NULL,
	"breakdown_id" varchar NOT NULL,
	"price" numeric(10, 4) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decorator_matrix_rows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" varchar NOT NULL,
	"row_label" varchar(255) DEFAULT '' NOT NULL,
	"unit_cost" numeric(10, 4),
	"per_unit" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "decorator_matrix_entries" CASCADE;--> statement-breakpoint
ALTER TABLE "decorator_matrices" ADD COLUMN IF NOT EXISTS "charge_type" varchar(20) DEFAULT 'run' NOT NULL;--> statement-breakpoint
ALTER TABLE "decorator_matrices" ADD COLUMN IF NOT EXISTS "display_type" varchar(20) DEFAULT 'table' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "decorator_matrix_breakdowns" ADD CONSTRAINT "decorator_matrix_breakdowns_matrix_id_decorator_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."decorator_matrices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "decorator_matrix_cells" ADD CONSTRAINT "decorator_matrix_cells_matrix_id_decorator_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."decorator_matrices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "decorator_matrix_cells" ADD CONSTRAINT "decorator_matrix_cells_row_id_decorator_matrix_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."decorator_matrix_rows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "decorator_matrix_cells" ADD CONSTRAINT "decorator_matrix_cells_breakdown_id_decorator_matrix_breakdowns_id_fk" FOREIGN KEY ("breakdown_id") REFERENCES "public"."decorator_matrix_breakdowns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "decorator_matrix_rows" ADD CONSTRAINT "decorator_matrix_rows_matrix_id_decorator_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."decorator_matrices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "decorator_matrices" DROP COLUMN IF EXISTS "matrix_type";
