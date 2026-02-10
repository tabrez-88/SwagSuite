import { db } from './db';
import { orders } from '@shared/schema';
import { notifications } from '@shared/project-schema';
import { and, isNotNull, sql, eq } from 'drizzle-orm';
import { storage } from './storage';

class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  start(intervalMs: number = 3600000) {
    console.log('📅 Starting notification scheduler...');

    // Run immediately on start
    this.processDailyNotifications();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.processDailyNotifications();
    }, intervalMs);

    console.log(`✓ Notification scheduler started (checking every ${intervalMs / 1000 / 60} minutes)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('✓ Notification scheduler stopped');
    }
  }

  async processDailyNotifications() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Query orders with next action date = today
      const ordersWithActions = await db
        .select()
        .from(orders)
        .where(
          and(
            isNotNull(orders.nextActionDate),
            sql`DATE(${orders.nextActionDate}) = DATE(${today})`
          )
        );

      if (ordersWithActions.length === 0) {
        return;
      }

      let notificationsSent = 0;
      let emailsSent = 0;

      for (const order of ordersWithActions) {
        // Check if we already sent notifications for this order today
        const existing = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.orderId, order.id),
              eq(notifications.type, 'next_action_due'),
              sql`DATE(${notifications.createdAt}) = DATE(${today})`
            )
          );

        if (existing.length > 0) continue;

        // Determine who to notify
        const usersToNotify = new Set<string>();
        if (order.assignedUserId) usersToNotify.add(order.assignedUserId);
        if (order.productionManagerId) usersToNotify.add(order.productionManagerId);

        if (usersToNotify.size === 0) continue;

        // Create in-app notifications
        for (const userId of usersToNotify) {
          try {
            await db.insert(notifications).values({
              recipientId: userId,
              orderId: order.id,
              type: 'next_action_due',
              title: `Action Due: Order #${order.orderNumber}`,
              message: order.nextActionNotes
                ? `Next action due today: ${order.nextActionNotes}`
                : `Next action is due today for order #${order.orderNumber}.`,
            });
            notificationsSent++;
          } catch (e) {
            console.error(`Failed to create notification for user ${userId}:`, e);
          }
        }

        // Send email notifications
        try {
          const { emailService } = await import('./emailService');

          for (const userId of usersToNotify) {
            const user = await storage.getUser(userId);
            if (user?.email) {
              await emailService.sendEmail({
                to: user.email,
                subject: `Action Due Today: Order #${order.orderNumber}`,
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                      <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Action Due Today</h1>
                      </div>
                      <div style="padding: 30px;">
                        <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                          This is a reminder that an action is due today for the following order:
                        </p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                          <p style="margin: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
                          <p style="margin: 5px 0;"><strong>Current Stage:</strong> ${order.currentStage}</p>
                          ${order.nextActionNotes ? `<p style="margin: 5px 0;"><strong>Action:</strong> ${order.nextActionNotes}</p>` : ''}
                        </div>
                        <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                          Please log in to SwagSuite to review and complete this action.
                        </p>
                      </div>
                      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `,
                userId,
              });
              emailsSent++;
            }
          }
        } catch (emailError) {
          console.error(`Failed to send email notifications for order ${order.orderNumber}:`, emailError);
        }
      }

      if (notificationsSent > 0 || emailsSent > 0) {
        console.log(`🔔 Daily notifications: ${ordersWithActions.length} orders, ${notificationsSent} in-app, ${emailsSent} emails`);
      }
    } catch (error) {
      console.error('❌ Error processing daily notifications:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
