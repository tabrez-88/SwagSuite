import "dotenv/config";
import { neon } from "@neondatabase/serverless";

interface LegacyCompany {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  billing_address: any;
  shipping_addresses: any;
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Check how many companies we have
  const companies = await sql`SELECT id, name, address, city, state, zip_code, country, billing_address, shipping_addresses FROM companies` as LegacyCompany[];
  console.log(`Found ${companies.length} companies to process`);

  let created = 0;

  for (const company of companies) {
    const hasFlat = company.address || company.city || company.state || company.zip_code;
    const billing = typeof company.billing_address === "string"
      ? JSON.parse(company.billing_address)
      : company.billing_address;
    const shippingArr = typeof company.shipping_addresses === "string"
      ? JSON.parse(company.shipping_addresses)
      : company.shipping_addresses;

    // 1. Migrate flat address columns as "Primary" address (type: both, isDefault)
    if (hasFlat) {
      await sql`
        INSERT INTO company_addresses (company_id, address_name, street, city, state, zip_code, country, address_type, is_default)
        VALUES (${company.id}, 'Primary', ${company.address}, ${company.city}, ${company.state}, ${company.zip_code}, ${company.country || 'US'}, 'both', true)
      `;
      created++;
    }

    // 2. Migrate billingAddress JSONB (if different from flat address)
    if (billing && (billing.street || billing.city)) {
      const isDuplicate = hasFlat &&
        billing.street === company.address &&
        billing.city === company.city &&
        billing.state === company.state;

      if (!isDuplicate) {
        await sql`
          INSERT INTO company_addresses (company_id, address_name, street, city, state, zip_code, country, address_type, is_default)
          VALUES (${company.id}, 'Billing', ${billing.street || null}, ${billing.city || null}, ${billing.state || null}, ${billing.zipCode || billing.zip_code || null}, ${billing.country || 'US'}, 'billing', ${!hasFlat})
        `;
        created++;
      }
    }

    // 3. Migrate shippingAddresses JSONB array
    if (Array.isArray(shippingArr)) {
      for (const addr of shippingArr) {
        if (addr.street || addr.city) {
          await sql`
            INSERT INTO company_addresses (company_id, address_name, street, city, state, zip_code, country, address_type, is_default)
            VALUES (${company.id}, ${addr.label || 'Shipping'}, ${addr.street || null}, ${addr.city || null}, ${addr.state || null}, ${addr.zipCode || addr.zip_code || null}, ${addr.country || 'US'}, 'shipping', false)
          `;
          created++;
        }
      }
    }
  }

  // 4. Set all existing contacts as active
  const contactResult = await sql`UPDATE contacts SET is_active = true WHERE is_active IS NULL`;
  console.log(`Set ${contactResult.length || 'all'} contacts as active`);

  console.log(`\nData migration complete! Created ${created} company addresses from ${companies.length} companies.`);
}

main().catch(e => {
  console.error("Data migration failed:", e);
  process.exit(1);
});
