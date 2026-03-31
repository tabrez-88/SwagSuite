ALTER TABLE "decorator_matrix_entries" ALTER COLUMN "min_quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "decorator_matrices" ADD COLUMN "matrix_type" varchar(50) DEFAULT 'run_charge_table' NOT NULL;--> statement-breakpoint
ALTER TABLE "decorator_matrices" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "decorator_matrix_entries" ADD COLUMN "row_label" varchar(255);--> statement-breakpoint
ALTER TABLE "decorator_matrix_entries" ADD COLUMN "unit_cost" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "decorator_matrix_entries" ADD COLUMN "per_unit" varchar(100);