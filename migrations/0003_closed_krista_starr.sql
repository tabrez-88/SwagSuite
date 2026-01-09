ALTER TABLE "sage_products" ALTER COLUMN "weight" SET DATA TYPE numeric(10, 4);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "supplier_id" varchar;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;