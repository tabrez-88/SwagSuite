// Load environment variables
import 'dotenv/config';

import { db } from "../server/db";
import { orderItems, products } from "../shared/schema";
import { eq } from "drizzle-orm";

async function syncOrderItemsSuppliers() {
  console.log("🔄 Syncing order items with current product supplier data...\n");

  try {
    // Get all order items
    const allOrderItems = await db.select().from(orderItems);
    console.log(`Found ${allOrderItems.length} order items to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let noProductCount = 0;
    let noSupplierCount = 0;

    for (const item of allOrderItems) {
      if (!item.productId) {
        console.log(`⚠️  Order item ${item.id} has no productId - skipped`);
        skippedCount++;
        continue;
      }

      // Get current product data
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        console.log(`❌ Product ${item.productId} not found for order item ${item.id}`);
        noProductCount++;
        continue;
      }

      if (!product.supplierId) {
        console.log(`⚠️  Product "${product.name}" has no supplierId - order item ${item.id} skipped`);
        noSupplierCount++;
        continue;
      }

      // Update order item if supplierId is different
      if (item.supplierId !== product.supplierId) {
        await db
          .update(orderItems)
          .set({ supplierId: product.supplierId })
          .where(eq(orderItems.id, item.id));

        console.log(`✅ Updated order item ${item.id} (${product.name})`);
        console.log(`   Old supplierId: ${item.supplierId || "null"}`);
        console.log(`   New supplierId: ${product.supplierId}\n`);
        updatedCount++;
      }
    }

    console.log("\n📊 Sync Summary:");
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Already synced: ${allOrderItems.length - updatedCount - skippedCount - noProductCount - noSupplierCount}`);
    console.log(`   ⚠️  No productId: ${skippedCount}`);
    console.log(`   ❌ Product not found: ${noProductCount}`);
    console.log(`   ⚠️  Product has no supplier: ${noSupplierCount}`);
    console.log(`   📦 Total items: ${allOrderItems.length}`);

  } catch (error) {
    console.error("❌ Error syncing order items:", error);
    process.exit(1);
  }

  process.exit(0);
}

syncOrderItemsSuppliers();
