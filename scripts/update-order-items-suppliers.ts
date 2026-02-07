/**
 * Update existing order items to add supplierId from their products
 */
import 'dotenv/config';
import { db } from '../server/db';
import { orderItems, products } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateOrderItemsSuppliers() {
  console.log('🔄 Starting to update order items with supplier IDs from products...');

  try {
    // Get all order items
    const allOrderItems = await db.select().from(orderItems);
    console.log(`Found ${allOrderItems.length} order items to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const item of allOrderItems) {
      try {
        // Skip if already has supplierId
        if (item.supplierId) {
          skippedCount++;
          continue;
        }

        // Get the product's supplierId
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId!))
          .limit(1);

        if (product && product.supplierId) {
          // Update the order item with the supplier from its product
          await db
            .update(orderItems)
            .set({ supplierId: product.supplierId })
            .where(eq(orderItems.id, item.id));

          updatedCount++;
          console.log(`✅ Updated order item ${item.id} with supplier ${product.supplierId}`);
        } else {
          console.log(`⚠️  No supplier found for product ${item.productId} (order item ${item.id})`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating order item ${item.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped (already had supplier): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('✨ Done!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

updateOrderItemsSuppliers();
