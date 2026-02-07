/**
 * Recalculate all order totals from their order items
 */
import 'dotenv/config';
import { db } from '../server/db';
import { orders, orderItems } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function recalculateOrderTotals() {
  console.log('🔄 Starting to recalculate all order totals...');

  try {
    // Get all orders
    const allOrders = await db.select().from(orders);
    console.log(`Found ${allOrders.length} orders to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of allOrders) {
      try {
        // Get all items for this order
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        if (items.length === 0) {
          console.log(`⏭️  Order ${order.orderNumber} has no items, skipping`);
          skippedCount++;
          continue;
        }

        // Calculate subtotal from all items
        const subtotal = items.reduce((sum, item) => {
          return sum + parseFloat(item.totalPrice || '0');
        }, 0);

        const currentTotal = parseFloat(order.total || '0');

        // Only update if totals are different
        if (Math.abs(currentTotal - subtotal) > 0.01) {
          await db
            .update(orders)
            .set({
              subtotal: subtotal.toFixed(2),
              total: subtotal.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          updatedCount++;
          console.log(`✅ Updated ${order.orderNumber}: $${currentTotal.toFixed(2)} → $${subtotal.toFixed(2)} (${items.length} items)`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating order ${order.orderNumber}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped (already correct or no items): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('✨ Done!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

recalculateOrderTotals();
