import { db } from '../db';
import { orders, invoices, quoteApprovals, artworkApprovals } from '@shared/schema';
import { notifications, projectActivities } from '@shared/schema';
import { and, isNotNull, isNull, sql, eq, lt, or } from 'drizzle-orm';
import { projectRepository } from '../repositories/project.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { userRepository } from '../repositories/user.repository';
import { companyRepository } from '../repositories/company.repository';
import { contactRepository } from '../repositories/contact.repository';
import { format } from 'date-fns';

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

      // Also process overdue invoices, expired presentations, and follow-up reminders
      await this.processOverdueInvoices();
      await this.processExpiredPresentations();
      await this.processFollowUpReminders();
      await this.processInvoiceReminders();
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
}

export const notificationScheduler = new NotificationScheduler();
