import { db } from '../db';
import { orders, invoices, quoteApprovals, artworkApprovals, orderShipments } from '@shared/schema';
import { notifications, projectActivities } from '@shared/schema';
import { and, isNotNull, isNull, sql, eq, lt, or, inArray } from 'drizzle-orm';
import { projectRepository } from '../repositories/project.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { userRepository } from '../repositories/user.repository';
import { companyRepository } from '../repositories/company.repository';
import { contactRepository } from '../repositories/contact.repository';
import { format, differenceInDays } from 'date-fns';
import { ShipStationService, getShipStationCredentials } from './shipstation.service';
import { sendSlackMessage } from './slack.service';
import { integrationRepository } from '../repositories/integration.repository';

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
          const { emailService } = await import('./email.service');

          for (const userId of usersToNotify) {
            const user = await userRepository.getUser(userId);
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

      // Also process overdue invoices, expired presentations, follow-up reminders, and shipping tracking
      await this.processOverdueInvoices();
      await this.processExpiredPresentations();
      await this.processFollowUpReminders();
      await this.processInvoiceReminders();
      await this.processShippingTracking();
    } catch (error) {
      console.error('❌ Error processing daily notifications:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processOverdueInvoices() {
    try {
      const now = new Date();

      const overdueInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'pending'),
            isNotNull(invoices.dueDate),
            lt(invoices.dueDate, now)
          )
        );

      if (overdueInvoices.length === 0) return;

      let count = 0;
      for (const invoice of overdueInvoices) {
        try {
          await invoiceRepository.updateInvoice(invoice.id, { status: 'overdue' });

          // Log activity
          if (invoice.orderId) {
            const invoiceOrder = await projectRepository.getOrder(invoice.orderId);
            if (invoiceOrder?.assignedUserId) {
              await db.insert(projectActivities).values({
                orderId: invoice.orderId,
                userId: invoiceOrder.assignedUserId,
                activityType: 'system_action',
                content: `Invoice ${invoice.invoiceNumber} marked as overdue (was due ${invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "N/A"})`,
                metadata: { action: 'invoice_overdue', invoiceId: invoice.id },
                isSystemGenerated: true,
              });
            }
          }
          count++;
        } catch (e) {
          console.error(`Failed to mark invoice ${invoice.id} as overdue:`, e);
        }
      }

      if (count > 0) {
        console.log(`📋 Auto-overdue: ${count} invoice(s) marked as overdue`);
      }
    } catch (error) {
      console.error('❌ Error processing overdue invoices:', error);
    }
  }
  async processExpiredPresentations() {
    try {
      const now = new Date();

      // Find orders with presentation expiryDate that have passed and are still open/client_review
      const expiredOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            sql`${orders.presentationStatus} IN ('open', 'client_review')`,
            sql`(${orders.stageData}::jsonb -> 'presentation' ->> 'expiryDate') IS NOT NULL`,
            sql`(${orders.stageData}::jsonb -> 'presentation' ->> 'expiryDate')::date < ${now}::date`
          )
        );

      if (expiredOrders.length === 0) return;

      let count = 0;
      for (const order of expiredOrders) {
        try {
          await projectRepository.updateOrder(order.id, { presentationStatus: 'closed' } as any);

          if (order.assignedUserId) {
            await db.insert(projectActivities).values({
              orderId: order.id,
              userId: order.assignedUserId,
              activityType: 'system_action',
              content: `Presentation automatically closed — expiry date passed`,
              metadata: { action: 'presentation_expired' },
              isSystemGenerated: true,
            });
          }
          count++;
        } catch (e) {
          console.error(`Failed to close expired presentation for order ${order.id}:`, e);
        }
      }

      if (count > 0) {
        console.log(`📋 Auto-expired: ${count} presentation(s) closed`);
      }
    } catch (error) {
      console.error('❌ Error processing expired presentations:', error);
    }
  }
  /**
   * Send follow-up reminders for pending approvals (quotes, sales orders, proofs)
   * that haven't been responded to after a configurable number of days.
   * Only sends one reminder per approval to avoid spamming.
   */
  async processFollowUpReminders() {
    const FOLLOW_UP_AFTER_DAYS = 3; // Send reminder after 3 days of no response

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - FOLLOW_UP_AFTER_DAYS);

      // 1. Pending quote/SO approvals older than X days with no reminder sent yet
      const pendingQuoteApprovals = await db
        .select()
        .from(quoteApprovals)
        .where(
          and(
            eq(quoteApprovals.status, 'pending'),
            isNotNull(quoteApprovals.clientEmail),
            lt(quoteApprovals.createdAt, cutoffDate),
            isNull(quoteApprovals.reminderSentAt)
          )
        );

      let quoteReminders = 0;
      for (const approval of pendingQuoteApprovals) {
        try {
          const order = await projectRepository.getOrder(approval.orderId);
          if (!order) continue;

          const company = order.companyId ? await companyRepository.getById(order.companyId) : null;
          const companyName = company?.name || 'your company';

          // Determine if this is a quote or SO approval
          const isSOApproval = (order as any).salesOrderStatus === 'pending_client_approval';
          const docType = isSOApproval ? 'Sales Order' : 'Quote';
          const approvalUrl = `${process.env.APP_URL || 'https://app.swagsuite.com'}/client-approval/${approval.approvalToken}`;

          const clientFirstName = approval.clientName?.split(' ')[0] || 'there';

          const { emailService } = await import('./email.service');
          await emailService.sendEmail({
            to: approval.clientEmail!,
            subject: `Reminder: ${docType} #${order.orderNumber} Awaiting Your Approval`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <div style="background-color: #7c3aed; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Friendly Reminder</h1>
                  </div>
                  <div style="padding: 30px;">
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Hi ${clientFirstName},
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Just a friendly follow-up regarding the ${docType.toLowerCase()} we sent for your project with <strong>${companyName}</strong>.
                      We wanted to make sure you had a chance to review it.
                    </p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>${docType}:</strong> #${order.orderNumber}</p>
                      ${approval.quoteTotal ? `<p style="margin: 5px 0;"><strong>Total:</strong> $${Number(approval.quoteTotal).toLocaleString()}</p>` : ''}
                      <p style="margin: 5px 0;"><strong>Sent:</strong> ${approval.createdAt ? format(new Date(approval.createdAt), "MMMM d, yyyy") : 'N/A'}</p>
                    </div>
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="${approvalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Review ${docType}
                      </a>
                    </div>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      If you have any questions or need changes, please don't hesitate to reach out. We're happy to help!
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Best regards,<br>The SwagSuite Team
                    </p>
                  </div>
                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          // Mark reminder as sent
          await db.update(quoteApprovals)
            .set({ reminderSentAt: new Date() })
            .where(eq(quoteApprovals.id, approval.id));

          // Log activity
          if (order.assignedUserId) {
            await db.insert(projectActivities).values({
              orderId: order.id,
              userId: order.assignedUserId,
              activityType: 'system_action',
              content: `Follow-up reminder sent to ${approval.clientEmail} for ${docType.toLowerCase()} approval`,
              metadata: { action: 'follow_up_reminder', approvalType: docType.toLowerCase(), approvalId: approval.id },
              isSystemGenerated: true,
            });
          }

          quoteReminders++;
        } catch (e) {
          console.error(`Failed to send follow-up for approval ${approval.id}:`, e);
        }
      }

      // 2. Pending artwork/proof approvals older than X days with no reminder sent
      const pendingProofApprovals = await db
        .select()
        .from(artworkApprovals)
        .where(
          and(
            eq(artworkApprovals.status, 'pending'),
            isNotNull(artworkApprovals.clientEmail),
            lt(artworkApprovals.createdAt, cutoffDate),
            isNull(artworkApprovals.reminderSentAt)
          )
        );

      let proofReminders = 0;
      for (const approval of pendingProofApprovals) {
        try {
          const order = await projectRepository.getOrder(approval.orderId);
          if (!order) continue;

          const clientFirstName = approval.clientName?.split(' ')[0] || 'there';
          const approvalUrl = `${process.env.APP_URL || 'https://app.swagsuite.com'}/approval/${approval.approvalToken}`;

          const { emailService } = await import('./email.service');
          await emailService.sendEmail({
            to: approval.clientEmail!,
            subject: `Reminder: Artwork Proof for Order #${order.orderNumber} Awaiting Approval`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <div style="background-color: #7c3aed; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Proof Approval Reminder</h1>
                  </div>
                  <div style="padding: 30px;">
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Hi ${clientFirstName},
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      We're following up on the artwork proof we sent for your order <strong>#${order.orderNumber}</strong>.
                      Your approval is needed so we can move forward with production.
                    </p>
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="${approvalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Review Proof
                      </a>
                    </div>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      If you need any changes or have questions, just let us know — we're here to help!
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Best regards,<br>The SwagSuite Team
                    </p>
                  </div>
                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          // Mark reminder as sent
          await db.update(artworkApprovals)
            .set({ reminderSentAt: new Date() })
            .where(eq(artworkApprovals.id, approval.id));

          // Log activity
          if (order.assignedUserId) {
            await db.insert(projectActivities).values({
              orderId: order.id,
              userId: order.assignedUserId,
              activityType: 'system_action',
              content: `Proof follow-up reminder sent to ${approval.clientEmail}`,
              metadata: { action: 'follow_up_reminder', approvalType: 'proof', approvalId: approval.id },
              isSystemGenerated: true,
            });
          }

          proofReminders++;
        } catch (e) {
          console.error(`Failed to send proof follow-up for approval ${approval.id}:`, e);
        }
      }

      const totalReminders = quoteReminders + proofReminders;
      if (totalReminders > 0) {
        console.log(`📨 Follow-up reminders: ${quoteReminders} quote/SO, ${proofReminders} proof approval(s)`);
      }
    } catch (error) {
      console.error('❌ Error processing follow-up reminders:', error);
    }
  }

  /**
   * Send recurring payment reminders for unpaid invoices that have reminder scheduling enabled.
   * Checks invoices where reminderEnabled=true, status is pending/sent/overdue,
   * and nextReminderDate has passed. Sends email, advances next reminder date, and logs activity.
   */
  async processInvoiceReminders() {
    try {
      const now = new Date();

      const dueInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.reminderEnabled, true),
            sql`${invoices.status} IN ('pending', 'sent', 'overdue')`,
            isNotNull(invoices.nextReminderDate),
            lt(invoices.nextReminderDate, now)
          )
        );

      if (dueInvoices.length === 0) return;

      let count = 0;
      for (const invoice of dueInvoices) {
        try {
          if (!invoice.orderId) continue;

          const order = await projectRepository.getOrder(invoice.orderId);
          if (!order) continue;

          // Find the client contact email from the order
          let recipientEmail: string | null = null;
          let recipientName = '';

          if (order.contactId) {
            const contact = await contactRepository.getById(order.contactId);
            if (contact?.email) {
              recipientEmail = contact.email;
              recipientName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
            }
          }

          if (!recipientEmail) continue;

          const clientFirstName = recipientName.split(' ')[0] || 'there';
          const company = order.companyId ? await companyRepository.getById(order.companyId) : null;
          const companyName = company?.name || 'SwagSuite';
          const dueDateStr = invoice.dueDate
            ? format(new Date(invoice.dueDate), 'MMMM d, yyyy')
            : 'N/A';
          const totalStr = invoice.totalAmount
            ? `$${Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '';

          const { emailService } = await import('./email.service');
          await emailService.sendEmail({
            to: recipientEmail,
            subject: `Payment Reminder: Invoice #${invoice.invoiceNumber} — ${totalStr} due`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <div style="background-color: #dc2626; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Payment Reminder</h1>
                  </div>
                  <div style="padding: 30px;">
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Hi ${clientFirstName},
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      This is a friendly reminder that payment is still outstanding for the following invoice:
                    </p>
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                      <p style="margin: 5px 0;"><strong>Invoice:</strong> #${invoice.invoiceNumber}</p>
                      ${totalStr ? `<p style="margin: 5px 0;"><strong>Amount:</strong> ${totalStr}</p>` : ''}
                      <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDateStr}</p>
                      <p style="margin: 5px 0;"><strong>Status:</strong> ${invoice.status === 'overdue' ? 'Overdue' : 'Unpaid'}</p>
                    </div>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Please arrange payment at your earliest convenience. If you've already sent payment, please disregard this notice.
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      If you have any questions regarding this invoice, please don't hesitate to reach out.
                    </p>
                    <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                      Best regards,<br>${companyName}
                    </p>
                  </div>
                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          // Advance nextReminderDate by frequency and update lastReminderSentAt
          const frequencyDays = invoice.reminderFrequencyDays || 7;
          const nextDate = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

          await invoiceRepository.updateInvoice(invoice.id, {
            lastReminderSentAt: now,
            nextReminderDate: nextDate,
          });

          // Log activity
          if (order.assignedUserId) {
            await db.insert(projectActivities).values({
              orderId: invoice.orderId,
              userId: order.assignedUserId,
              activityType: 'system_action',
              content: `Payment reminder sent to ${recipientEmail} for Invoice #${invoice.invoiceNumber}`,
              metadata: {
                action: 'invoice_reminder_sent',
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                recipientEmail,
              },
              isSystemGenerated: true,
            });
          }

          count++;
        } catch (e) {
          console.error(`Failed to send invoice reminder for invoice ${invoice.id}:`, e);
        }
      }

      if (count > 0) {
        console.log(`💰 Invoice reminders: ${count} payment reminder(s) sent`);
      }
    } catch (error) {
      console.error('❌ Error processing invoice reminders:', error);
    }
  }
  /**
   * Daily shipping tracking check:
   * 1. Sync tracking status from ShipStation for active shipments
   * 2. Detect delays (ETA > in-hands date) and notify via Slack + email
   * 3. Auto-update shipment status to "delivered" when confirmed
   * 4. Send client notifications for status changes (if enabled per order)
   */
  async processShippingTracking() {
    try {
      // Get active shipments (shipped or in_transit)
      const activeShipments = await db
        .select()
        .from(orderShipments)
        .where(
          sql`${orderShipments.status} IN ('shipped', 'in_transit')`
        );

      if (activeShipments.length === 0) return;

      // Try to get ShipStation credentials for tracking sync
      const credentials = await getShipStationCredentials();
      let shipStationService: ShipStationService | null = null;
      if (credentials) {
        shipStationService = new ShipStationService(credentials);
      }

      // Get Slack settings for delay alerts
      const settings = await integrationRepository.getIntegrationSettings();
      const slackChannelId = settings?.slackChannelId || process.env.SLACK_CHANNEL_ID?.trim();

      let updatedCount = 0;
      let delayAlerts = 0;
      let deliveredCount = 0;

      for (const shipment of activeShipments) {
        try {
          // 1. Sync from ShipStation if available and linked
          if (shipStationService && shipment.shipstationShipmentId) {
            const ssResult = await shipStationService.getShipments({
              trackingNumber: shipment.trackingNumber || undefined,
              pageSize: 1,
            });

            if (ssResult.shipments?.length > 0) {
              const ss = ssResult.shipments[0];
              const newStatus = ShipStationService.mapShipmentStatus(ss);
              const wasDelivered = newStatus === 'delivered' && shipment.status !== 'delivered';

              await db
                .update(orderShipments)
                .set({
                  status: newStatus,
                  carrier: ShipStationService.mapCarrierCode(ss.carrierCode),
                  actualDelivery: ss.deliveryDate ? new Date(ss.deliveryDate) : undefined,
                  lastTrackingCheck: new Date(),
                  shipstationMetadata: ss as any,
                  updatedAt: new Date(),
                })
                .where(eq(orderShipments.id, shipment.id));

              // Send tracking update email if status changed and tracking emails are enabled
              if (newStatus !== shipment.status && newStatus !== 'delivered') {
                await this.sendTrackingUpdateEmail(shipment.orderId, shipment.id, shipment.status || '', newStatus);
              }

              if (wasDelivered) {
                await this.handleShipmentDelivered(shipment);
                deliveredCount++;
              }
              updatedCount++;
            }
          }

          // 2. Delay detection: compare estimatedDelivery vs order.inHandsDate
          if (!shipment.delayAlertSent && shipment.estimatedDelivery) {
            const [order] = await db
              .select()
              .from(orders)
              .where(eq(orders.id, shipment.orderId))
              .limit(1);

            if (order?.inHandsDate) {
              const eta = new Date(shipment.estimatedDelivery);
              const inHands = new Date(order.inHandsDate);

              if (eta > inHands) {
                // Delay detected!
                const daysLate = differenceInDays(eta, inHands);

                // Mark alert as sent to prevent spam
                await db
                  .update(orderShipments)
                  .set({ delayAlertSent: true, updatedAt: new Date() })
                  .where(eq(orderShipments.id, shipment.id));

                // Send Slack alert
                if (slackChannelId) {
                  await sendSlackMessage({
                    channel: slackChannelId,
                    text: `Shipping Delay Alert - Order #${order.orderNumber}`,
                    blocks: [
                      {
                        type: "section",
                        text: {
                          type: "mrkdwn",
                          text: `*:warning: Shipping Delay Detected*\n\n*Order:* #${order.orderNumber}\n*Carrier:* ${shipment.carrier || 'Unknown'}\n*Tracking:* ${shipment.trackingNumber || 'N/A'}\n*ETA:* ${format(eta, 'MMM d, yyyy')}\n*In-Hands Date:* ${format(inHands, 'MMM d, yyyy')}\n*Late by:* ${daysLate} day(s)\n\n_Action needed — please contact the carrier or supplier._`,
                        },
                      },
                    ],
                  });
                }

                // Notify assigned sales rep via email + in-app notification
                if (order.assignedUserId) {
                  const user = await userRepository.getUser(order.assignedUserId);

                  // In-app notification
                  await db.insert(notifications).values({
                    recipientId: order.assignedUserId,
                    orderId: order.id,
                    type: 'project_update',
                    title: `Shipping Delay: Order #${order.orderNumber}`,
                    message: `Estimated delivery (${format(eta, 'MMM d')}) is ${daysLate} day(s) after in-hands date (${format(inHands, 'MMM d')}). Tracking: ${shipment.trackingNumber || 'N/A'}`,
                  });

                  // Email
                  if (user?.email) {
                    const { emailService } = await import('./email.service');
                    await emailService.sendEmail({
                      to: user.email,
                      subject: `Shipping Delay Alert: Order #${order.orderNumber}`,
                      html: this.buildShippingDelayEmail(order, shipment, eta, inHands, daysLate),
                      userId: order.assignedUserId,
                    });
                  }
                }

                // Log activity
                await db.insert(projectActivities).values({
                  orderId: order.id,
                  userId: order.assignedUserId || 'system',
                  activityType: 'system_action',
                  content: `Shipping delay detected: ETA ${format(eta, 'MMM d')} is ${daysLate} day(s) after in-hands date ${format(inHands, 'MMM d')}`,
                  metadata: {
                    action: 'shipping_delay_detected',
                    shipmentId: shipment.id,
                    trackingNumber: shipment.trackingNumber,
                    estimatedDelivery: eta.toISOString(),
                    inHandsDate: inHands.toISOString(),
                    daysLate,
                  },
                  isSystemGenerated: true,
                } as any);

                delayAlerts++;
              }
            }
          }

          // Update lastTrackingCheck even if no ShipStation
          await db
            .update(orderShipments)
            .set({ lastTrackingCheck: new Date() })
            .where(eq(orderShipments.id, shipment.id));
        } catch (e) {
          console.error(`Failed to process shipment ${shipment.id}:`, e);
        }
      }

      if (updatedCount > 0 || delayAlerts > 0 || deliveredCount > 0) {
        console.log(`📦 Shipping tracking: ${updatedCount} synced, ${deliveredCount} delivered, ${delayAlerts} delay alert(s)`);
      }
    } catch (error) {
      console.error('❌ Error processing shipping tracking:', error);
    }
  }

  /**
   * Handle shipment delivered: notify client + prompt sales rep
   */
  private async handleShipmentDelivered(shipment: any) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, shipment.orderId))
        .limit(1);

      if (!order) return;

      // Log activity
      await db.insert(projectActivities).values({
        orderId: order.id,
        userId: order.assignedUserId || 'system',
        activityType: 'system_action',
        content: `Shipment delivered (Tracking: ${shipment.trackingNumber || 'N/A'})`,
        metadata: {
          action: 'shipment_delivered',
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          carrier: shipment.carrier,
        },
        isSystemGenerated: true,
      } as any);

      // Check if shipping notifications are enabled for this order
      if ((order as any).enableShippingNotifications === false) return;

      // Send delivered notification to client
      if (order.contactId) {
        const contact = await contactRepository.getById(order.contactId);
        if (contact?.email) {
          const { emailService } = await import('./email.service');
          await emailService.sendEmail({
            to: contact.email,
            subject: `Your Order #${order.orderNumber} Has Been Delivered!`,
            html: this.buildDeliveredClientEmail(order, shipment, contact),
          });
        }
      }

      // Notify sales rep: "Order delivered - send follow-up?"
      if (order.assignedUserId) {
        const user = await userRepository.getUser(order.assignedUserId);

        await db.insert(notifications).values({
          recipientId: order.assignedUserId,
          orderId: order.id,
          type: 'project_update',
          title: `Delivered: Order #${order.orderNumber}`,
          message: `Order has been delivered. Consider sending a follow-up email to the client.`,
        });

        if (user?.email) {
          const { emailService } = await import('./email.service');
          await emailService.sendEmail({
            to: user.email,
            subject: `Order #${order.orderNumber} Delivered — Send Follow-up?`,
            html: this.buildDeliveredRepEmail(order, shipment),
            userId: order.assignedUserId,
          });
        }
      }
    } catch (e) {
      console.error('Error handling shipment delivered:', e);
    }
  }

  // ── Email Templates ──

  private buildShippingDelayEmail(order: any, shipment: any, eta: Date, inHands: Date, daysLate: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #dc2626; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Shipping Delay Alert</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              A shipping delay has been detected for the following order:
            </p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
              <p style="margin: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Carrier:</strong> ${shipment.carrier || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Tracking:</strong> ${shipment.trackingNumber || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${format(eta, 'MMMM d, yyyy')}</p>
              <p style="margin: 5px 0;"><strong>Customer In-Hands Date:</strong> ${format(inHands, 'MMMM d, yyyy')}</p>
              <p style="margin: 5px 0; color: #dc2626;"><strong>Late by:</strong> ${daysLate} day(s)</p>
            </div>
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              Please contact the carrier or supplier to resolve this delay. Consider notifying the client if the delay is significant.
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildDeliveredClientEmail(order: any, shipment: any, contact: any): string {
    const clientName = contact.firstName || 'there';
    const googleReviewUrl = process.env.GOOGLE_REVIEW_URL || '';
    const reviewSection = googleReviewUrl
      ? `<div style="text-align: center; margin: 25px 0;">
          <p style="color: #374151; font-size: 14px; margin-bottom: 15px;">We'd love to hear about your experience!</p>
          <a href="${googleReviewUrl}" style="display: inline-block; background-color: #4285f4; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Leave Us a Review on Google
          </a>
        </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #059669; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Order Has Been Delivered!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              Hi ${clientName},
            </p>
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              Great news! Your order has been delivered. We hope everything looks perfect!
            </p>
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0;">
              <p style="margin: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
              ${shipment.carrier ? `<p style="margin: 5px 0;"><strong>Carrier:</strong> ${shipment.carrier}</p>` : ''}
              ${shipment.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking:</strong> ${shipment.trackingNumber}</p>` : ''}
            </div>
            ${reviewSection}
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              If you have any questions or concerns about your order, please don't hesitate to reach out. We're always here to help!
            </p>
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              Thank you for your business!<br>The SwagSuite Team
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildDeliveredRepEmail(order: any, shipment: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #059669; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Delivered</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              Order <strong>#${order.orderNumber}</strong> has been delivered!
            </p>
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0;">
              <p style="margin: 5px 0;"><strong>Carrier:</strong> ${shipment.carrier || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Tracking:</strong> ${shipment.trackingNumber || 'N/A'}</p>
            </div>
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              <strong>Suggested next step:</strong> Send a follow-up email to the client thanking them for their business.
              This is a great opportunity to ask for feedback or a Google review.
            </p>
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              Log in to SwagSuite to send a follow-up from the project's Email tab.
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send shipping notification to client (called from shipment routes on status change)
   */
  async sendShippingNotificationToClient(orderId: string, shipmentId: string, eventType: 'scheduled' | 'shipped' | 'delivered') {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) return;
      if ((order as any).enableShippingNotifications === false) return;

      const [shipment] = await db
        .select()
        .from(orderShipments)
        .where(eq(orderShipments.id, shipmentId))
        .limit(1);

      if (!shipment) return;
      if (!order.contactId) return;

      const contact = await contactRepository.getById(order.contactId);
      if (!contact?.email) return;

      const { emailService } = await import('./email.service');
      const clientName = contact.firstName || 'there';

      if (eventType === 'scheduled' && shipment.shipDate) {
        const shipDateStr = format(new Date(shipment.shipDate), 'MMMM d, yyyy');
        await emailService.sendEmail({
          to: contact.email,
          subject: `Your Order #${order.orderNumber} — Shipping Update`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Shipping Update</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">Hi ${clientName},</p>
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                    Your order is scheduled to ship on or around <strong>${shipDateStr}</strong>.
                    You will receive shipping information as soon as it ships.
                  </p>
                  <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                    <p style="margin: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
                    <p style="margin: 5px 0;"><strong>Scheduled Ship Date:</strong> ${shipDateStr}</p>
                  </div>
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">Thank you for your patience!<br>The SwagSuite Team</p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } else if (eventType === 'shipped') {
        const trackingUrl = this.getTrackingUrl(shipment.carrier, shipment.trackingNumber);
        await emailService.sendEmail({
          to: contact.email,
          subject: `Your Order #${order.orderNumber} Has Shipped!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Order Has Shipped!</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">Hi ${clientName},</p>
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                    Great news! Your order is on its way.
                  </p>
                  <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                    <p style="margin: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
                    ${shipment.carrier ? `<p style="margin: 5px 0;"><strong>Carrier:</strong> ${shipment.carrier}</p>` : ''}
                    ${shipment.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking #:</strong> ${shipment.trackingNumber}</p>` : ''}
                    ${shipment.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${format(new Date(shipment.estimatedDelivery), 'MMMM d, yyyy')}</p>` : ''}
                  </div>
                  ${trackingUrl ? `<div style="text-align: center; margin: 25px 0;">
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                      Track Your Package
                    </a>
                  </div>` : ''}
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">Thank you for your order!<br>The SwagSuite Team</p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } else if (eventType === 'delivered') {
        await this.handleShipmentDelivered(shipment);
      }

      // Log activity
      await db.insert(projectActivities).values({
        orderId: order.id,
        userId: order.assignedUserId || 'system',
        activityType: 'system_action',
        content: `Shipping notification sent to client: ${eventType}`,
        metadata: {
          action: `shipping_notification_${eventType}`,
          shipmentId,
          recipientEmail: contact.email,
        },
        isSystemGenerated: true,
      } as any);
    } catch (error) {
      console.error('Error sending shipping notification:', error);
    }
  }

  /**
   * Phase 2: Send tracking update email to client when shipment status changes during transit.
   * Only sends if enableTrackingEmails is true on the order.
   * Tracks lastTrackingEmailStatus to avoid duplicate emails for the same status.
   */
  private async sendTrackingUpdateEmail(orderId: string, shipmentId: string, oldStatus: string, newStatus: string) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) return;
      if ((order as any).enableTrackingEmails !== true) return;
      if (!order.contactId) return;

      // Check if we already sent an email for this status
      const [shipment] = await db
        .select()
        .from(orderShipments)
        .where(eq(orderShipments.id, shipmentId))
        .limit(1);

      if (!shipment) return;
      if (shipment.lastTrackingEmailStatus === newStatus) return;

      const contact = await contactRepository.getById(order.contactId);
      if (!contact?.email) return;

      const { emailService } = await import('./email.service');
      const clientName = contact.firstName || 'there';
      const trackingUrl = this.getTrackingUrl(shipment.carrier, shipment.trackingNumber);

      const statusLabels: Record<string, string> = {
        'shipped': 'Shipped',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'pending': 'Pending',
      };

      const statusLabel = statusLabels[newStatus] || newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      const statusMessages: Record<string, string> = {
        'shipped': 'Your order has been picked up by the carrier and is on its way!',
        'in_transit': 'Your order is currently in transit and making its way to you.',
        'out_for_delivery': 'Great news! Your order is out for delivery and should arrive today.',
      };

      const statusMessage = statusMessages[newStatus] || `Your shipment status has been updated to: ${statusLabel}.`;

      await emailService.sendEmail({
        to: contact.email,
        subject: `Order #${order.orderNumber} — ${statusLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background-color: #7c3aed; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Tracking Update</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #374151; line-height: 1.6; font-size: 14px;">Hi ${clientName},</p>
                <p style="color: #374151; line-height: 1.6; font-size: 14px;">${statusMessage}</p>
                <div style="background-color: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd6fe;">
                  <p style="margin: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> ${statusLabel}</p>
                  <p style="margin: 5px 0;"><strong>Carrier:</strong> ${shipment.carrier || 'N/A'}</p>
                  ${shipment.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking:</strong> ${shipment.trackingNumber}</p>` : ''}
                  ${shipment.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${format(new Date(shipment.estimatedDelivery), 'MMMM d, yyyy')}</p>` : ''}
                </div>
                ${trackingUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${trackingUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Track Your Package</a></div>` : ''}
                <p style="color: #374151; line-height: 1.6; font-size: 14px;">Thank you for your patience!<br>The SwagSuite Team</p>
              </div>
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Update lastTrackingEmailStatus to prevent duplicate emails
      await db
        .update(orderShipments)
        .set({ lastTrackingEmailStatus: newStatus, updatedAt: new Date() })
        .where(eq(orderShipments.id, shipmentId));

      // Log activity
      await db.insert(projectActivities).values({
        orderId,
        userId: order.assignedUserId || 'system',
        activityType: 'system_action',
        content: `Tracking update email sent to client: ${oldStatus} → ${newStatus}`,
        metadata: {
          action: 'tracking_update_email',
          shipmentId,
          oldStatus,
          newStatus,
          recipientEmail: contact.email,
        },
        isSystemGenerated: true,
      } as any);

      console.log(`📧 Tracking update email sent for shipment ${shipmentId}: ${oldStatus} → ${newStatus}`);
    } catch (error) {
      console.error('Error sending tracking update email:', error);
    }
  }

  private getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
    if (!trackingNumber) return null;
    const urls: Record<string, string> = {
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };
    return urls[carrier || ''] || null;
  }
}

export const notificationScheduler = new NotificationScheduler();
