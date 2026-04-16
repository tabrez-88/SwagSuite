import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * Generates the next order number based on company settings.
 * 
 * Digit-aware starting numbers:
 *   4 digits → starts at 1001
 *   5 digits → starts at 10001
 *   6 digits → starts at 100001
 * 
 * Always increments from the current max numeric order number in the DB.
 * If the current max already exceeds the digit range (e.g., switching from
 * 6 digits down to 4), it continues incrementing without truncating.
 */
export async function generateOrderNumber(): Promise<string> {
  const { companySettings } = await import("@shared/schema");
  const [settings] = await db.select().from(companySettings).limit(1);
  const digits = settings?.orderNumberDigits || 5;

  // Digit-aware starting number: 10^(digits-1) + 1  →  4→1001, 5→10001, 6→100001
  const startingNumber = Math.pow(10, digits - 1) + 1;

  // Find highest purely-numeric order number. Legacy "ORD-YYYY-NNN" entries are ignored.
  const maxResult = await db.execute(
    sql`SELECT MAX(CAST(order_number AS INTEGER)) AS max_num FROM orders WHERE order_number ~ '^[0-9]+$'`
  );
  const maxRows = (maxResult as any).rows ?? maxResult;
  const currentMax = parseInt(maxRows?.[0]?.max_num || "0") || 0;

  const nextNumber = currentMax > 0 ? currentMax + 1 : startingNumber;

  return String(nextNumber);
}
