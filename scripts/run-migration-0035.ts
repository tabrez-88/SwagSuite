import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // 1. Create company_addresses table
  await sql`
    CREATE TABLE IF NOT EXISTS "company_addresses" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "company_id" varchar NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
      "address_name" varchar,
      "company_name_on_docs" varchar,
      "street" text,
      "street2" text,
      "city" varchar,
      "state" varchar,
      "zip_code" varchar,
      "country" varchar DEFAULT 'US',
      "address_type" varchar NOT NULL DEFAULT 'both',
      "is_default" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `;
  console.log("OK: Created company_addresses table");

  // 2. Create index
  await sql`CREATE INDEX IF NOT EXISTS "idx_company_addresses_company_id" ON "company_addresses"("company_id")`;
  console.log("OK: Created index");

  // 3. Contact enhancements
  await sql`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "department" varchar`;
  console.log("OK: Added contacts.department");

  await sql`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'`;
  console.log("OK: Added contacts.tags");

  await sql`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`;
  console.log("OK: Added contacts.is_active");

  await sql`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "mailing_address" text`;
  console.log("OK: Added contacts.mailing_address");

  await sql`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "no_marketing" boolean DEFAULT false`;
  console.log("OK: Added contacts.no_marketing");

  console.log("\nMigration 0035 applied successfully!");
}

main().catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});
