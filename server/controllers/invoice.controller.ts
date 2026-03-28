import type { Request, Response } from "express";
import { projectRepository } from "../repositories/project.repository";
import { invoiceRepository } from "../repositories/invoice.repository";
import { companyRepository } from "../repositories/company.repository";
import { settingsRepository } from "../repositories/settings.repository";
import { getQuickBooksCredentials } from "../services/quickbooks.service";
import { getStripeCredentials } from "../services/stripe.service";
import { getTaxJarCredentials } from "../services/taxjar.service";

export class InvoiceController {
  // =====================================================
  // QUICKBOOKS
  // =====================================================

  static async quickbooksAuth(req: Request, res: Response) {
    try {
      const qbService = await getQuickBooksCredentials();
      if (!qbService) return res.status(400).json({ message: "QuickBooks not configured" });
      res.json({ url: qbService.getAuthUri() });
    } catch (error) {
      console.error("QB Auth Error:", error);
      res.status(500).json({ message: "Failed to initiate QB Auth" });
    }
  }

  static async quickbooksCallback(req: Request, res: Response) {
    try {
      const { code, state, realmId } = req.query;
      const qbService = await getQuickBooksCredentials();
      if (!qbService) throw new Error("QB Service not ready");

      const tokens = await qbService.exchangeCodeForToken(code as string);

      await settingsRepository.upsertIntegrationSettings({
        qbRealmId: realmId as string,
        qbAccessToken: tokens.access_token,
        qbRefreshToken: tokens.refresh_token,
        quickbooksConnected: true
      });

      res.redirect('/settings?integration=quickbooks&status=success');
    } catch (error) {
      console.error("QB Callback Error:", error);
      res.redirect('/settings?integration=quickbooks&status=error');
    }
  }

  static async quickbooksSync(req: Request, res: Response) {
    try {
      const qbService = await getQuickBooksCredentials();
      if (!qbService) return res.status(400).json({ message: "QuickBooks not connected" });

      const invoiceId = await qbService.syncOrderToInvoice(req.params.id);
      res.json({ message: "Synced to QuickBooks", invoiceId });
    } catch (error) {
      console.error("QB Sync Error:", error);
      res.status(500).json({ message: "Sync failed", error: String(error) });
    }
  }

  // =====================================================
  // INVOICE CRUD
  // =====================================================

  static async createInvoice(req: Request, res: Response) {
    try {
      const order = await projectRepository.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      // Check if invoice already exists
      const existingInvoice = await invoiceRepository.getInvoiceByOrderId(order.id);
      if (existingInvoice) {
        return res.json(existingInvoice);
      }

      // Calculate tax using TaxJar
      const taxService = await getTaxJarCredentials();
      let taxAmount = 0;

      if (taxService && order.companyId) {
        const company = await companyRepository.getById(order.companyId);
        if (company && !company.taxExempt) {
          try {
            // Extract zip/state from order billing address or fall back to company default address
            let toZip = '10001';
            let toState = 'NY';
            if ((order as any).billingAddress) {
              try {
                const billing = JSON.parse((order as any).billingAddress);
                toZip = billing.zipCode || toZip;
                toState = billing.state || toState;
              } catch { /* ignore parse errors */ }
            }
            const taxCalc = await taxService.calculateTax({
              from_country: 'US',
              from_zip: '10001',
              from_state: 'NY',
              to_country: 'US',
              to_zip: toZip,
              to_state: toState,
              amount: Number(order.subtotal),
              shipping: Number(order.shipping || 0)
            });
            taxAmount = taxCalc.amount_to_collect;
          } catch (taxError) {
            console.error("TaxJar calculation error:", taxError);
            // Continue without tax if calculation fails
          }
        }
      }

      const totalAmount = Number(order.subtotal) + taxAmount + Number(order.shipping || 0);

      // Create invoice
      const invoice = await invoiceRepository.createInvoice({
        orderId: order.id,
        invoiceNumber: `INV-${Date.now()}`,
        subtotal: order.subtotal ?? '0',
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      // Sync to QuickBooks
      const qbService = await getQuickBooksCredentials();
      if (qbService) {
        try {
          const qbInvoiceId = await qbService.syncOrderToInvoice(order.id);
          await invoiceRepository.updateInvoice(invoice.id, {
            qbInvoiceId,
            qbSyncedAt: new Date()
          });
        } catch (qbError) {
          console.error("QB sync error during invoice creation:", qbError);
          // Continue even if QB sync fails
        }
      }

      res.json(invoice);
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(500).json({ message: String(error) });
    }
  }

  static async getInvoice(req: Request, res: Response) {
    try {
      const invoice = await invoiceRepository.getInvoiceByOrderId(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  }

  static async updateInvoice(req: Request, res: Response) {
    try {
      const invoice = await invoiceRepository.getInvoiceByOrderId(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const { status, dueDate, taxAmount, totalAmount, notes, sentAt, reminderEnabled, reminderFrequencyDays, nextReminderDate, lastReminderSentAt } = req.body;
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
      if (taxAmount !== undefined) updates.taxAmount = taxAmount;
      if (totalAmount !== undefined) updates.totalAmount = totalAmount;
      if (notes !== undefined) updates.notes = notes;
      if (sentAt !== undefined) updates.sentAt = new Date(sentAt);
      if (reminderEnabled !== undefined) updates.reminderEnabled = reminderEnabled;
      if (reminderFrequencyDays !== undefined) updates.reminderFrequencyDays = reminderFrequencyDays;
      if (nextReminderDate !== undefined) updates.nextReminderDate = new Date(nextReminderDate);
      if (lastReminderSentAt !== undefined) updates.lastReminderSentAt = new Date(lastReminderSentAt);

      const updated = await invoiceRepository.updateInvoice(invoice.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(500).json({ message: String(error) });
    }
  }

  // =====================================================
  // STRIPE PAYMENT LINK
  // =====================================================

  static async createPaymentLink(req: Request, res: Response) {
    try {
      const invoice = await invoiceRepository.getInvoice(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      console.log("Invoice payment-link:", invoice);

      const stripeService = await getStripeCredentials();
      if (!stripeService) return res.status(400).json({ message: "Stripe not configured" });

      if (!invoice.orderId) {
        return res.status(400).json({ message: "Invoice is not linked to an order" });
      }

      // Get order and company details
      const order = await projectRepository.getOrder(invoice.orderId);
      if (!order || !order.companyId) {
        return res.status(400).json({ message: "Order or company not found" });
      }

      console.log("Order payment-link:", order);

      const company = await companyRepository.getById(order.companyId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      console.log("Company payment-link:", company);

      // Find or create Stripe customer
      let stripeCustomer = await stripeService.searchCustomer(company.email || `${company.name}@example.com`);

      if (!stripeCustomer) {
        stripeCustomer = await stripeService.createCustomer(
          company.email || `${company.name}@example.com`,
          company.name
        );
      }

      console.log("Stripe customer payment-link:", stripeCustomer);

      // 1. Create draft invoice FIRST
      // pending_invoice_items_behavior: 'exclude' ensures we don't pick up random pending items from other failed attempts
      // Calculate days until due from invoice due date
      const daysUntilDue = invoice.dueDate
        ? Math.max(1, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 30;

      const stripeInvoice = await stripeService.createInvoice({
        customerId: stripeCustomer.id,
        collection_method: 'send_invoice',
        days_until_due: daysUntilDue,
        pending_invoice_items_behavior: 'exclude',
        payment_method_types: ['card', 'us_bank_account'],
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: order.id,
          orderNumber: order.orderNumber
        }
      });

      console.log("stripe invoice payment-link: ", stripeInvoice);

      // 2. Create detailed invoice line items
      // Add Subtotal line item
      const subtotalItem = await stripeService.createInvoiceItem({
        customerId: stripeCustomer.id,
        invoiceId: stripeInvoice.id,
        amount: Math.round(Number(invoice.subtotal) * 100), // Convert to cents
        currency: 'usd',
        description: `Order ${order.orderNumber} - Products & Services`
      });

      console.log("invoice subtotal item: ", subtotalItem);

      // Add Shipping line item (if > 0)
      if (Number(order.shipping) > 0) {
        const shippingItem = await stripeService.createInvoiceItem({
          customerId: stripeCustomer.id,
          invoiceId: stripeInvoice.id,
          amount: Math.round(Number(order.shipping) * 100),
          currency: 'usd',
          description: 'Shipping & Handling'
        });
        console.log("invoice shipping item: ", shippingItem);
      }

      // Add Tax line item (if > 0)
      if (Number(invoice.taxAmount) > 0) {
        const taxItem = await stripeService.createInvoiceItem({
          customerId: stripeCustomer.id,
          invoiceId: stripeInvoice.id,
          amount: Math.round(Number(invoice.taxAmount) * 100),
          currency: 'usd',
          description: 'Sales Tax (calculated via TaxJar)'
        });
        console.log("invoice tax item: ", taxItem);
      }

      // Add Credit Card Processing Fee (3%) — only applies if paying by credit card
      // Note: ACH payments do not incur this fee
      const invoiceTotal = Math.round(Number(invoice.totalAmount) * 100); // total in cents
      const ccFeeAmount = Math.round(invoiceTotal * 0.03);
      if (ccFeeAmount > 0) {
        const ccFeeItem = await stripeService.createInvoiceItem({
          customerId: stripeCustomer.id,
          invoiceId: stripeInvoice.id,
          amount: ccFeeAmount,
          currency: 'usd',
          description: 'Credit Card Processing Fee (3%) — waived if paying via ACH/Bank Transfer'
        });
        console.log("invoice cc fee item: ", ccFeeItem);
      }

      console.log("invoice items created with detailed breakdown");

      // 3. Finalize invoice to get hosted URL
      const finalizedInvoice = await stripeService.finalizeInvoice(stripeInvoice.id);

      console.log("finalized invoice payment-link: ", finalizedInvoice);

      // Update local invoice with Stripe details (including PDF URL)
      await invoiceRepository.updateInvoice(invoice.id, {
        stripeInvoiceId: finalizedInvoice.id,
        stripePaymentIntentId: finalizedInvoice.payment_intent,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        stripeInvoicePdfUrl: finalizedInvoice.invoice_pdf
      });

      res.json({
        paymentLink: finalizedInvoice.hosted_invoice_url,
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        stripeInvoicePdfUrl: finalizedInvoice.invoice_pdf
      });
    } catch (error) {
      console.error("Payment link error:", error);
      res.status(500).json({ message: String(error) });
    }
  }

  // =====================================================
  // MANUAL PAYMENT
  // =====================================================

  static async recordManualPayment(req: Request, res: Response) {
    try {
      const { paymentMethod, paymentReference, amount } = req.body;
      const invoice = await invoiceRepository.getInvoice(req.params.id);

      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const paymentAmount = amount || invoice.totalAmount;

      // Create payment transaction
      await invoiceRepository.createPaymentTransaction({
        invoiceId: invoice.id,
        amount: paymentAmount,
        paymentMethod, // 'check', 'wire', 'manual_card', 'credit'
        paymentReference, // Check #, Wire #, etc.
        status: 'completed'
      });

      // Update invoice status
      await invoiceRepository.updateInvoice(invoice.id, {
        status: 'paid',
        paymentMethod,
        paymentReference,
        paidAt: new Date()
      });

      // Sync to QuickBooks
      const qbService = await getQuickBooksCredentials();
      if (qbService && invoice.qbInvoiceId) {
        try {
          await qbService.markInvoiceAsPaid(invoice.qbInvoiceId, Number(paymentAmount));
        } catch (qbError) {
          console.error("QB payment sync error:", qbError);
          // Continue even if QB sync fails
        }
      }

      res.json({ message: "Payment recorded successfully" });
    } catch (error) {
      console.error("Manual payment error:", error);
      res.status(500).json({ message: String(error) });
    }
  }

  // =====================================================
  // STRIPE PAYMENT INTENT
  // =====================================================

  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency, orderId } = req.body;
      const stripeService = await getStripeCredentials();
      if (!stripeService) return res.status(400).json({ message: "Stripe not configured" });

      const intent = await stripeService.createPaymentIntent({
        amount, currency, orderId
      });
      res.json(intent);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  }

  // =====================================================
  // STRIPE WEBHOOK (no auth, raw body)
  // =====================================================

  static async stripeWebhook(req: Request, res: Response) {
    try {
      let event;
      if (typeof req.body === 'object' && req.body !== null && !Buffer.isBuffer(req.body)) {
        // Body already parsed by middleware
        event = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        // Raw buffer from express.raw()
        event = JSON.parse(req.body.toString());
      } else if (typeof req.body === 'string') {
        // String body
        event = JSON.parse(req.body);
      } else {
        throw new Error("Invalid request body format");
      }

      console.log("Webhook event type:", event.type);

      // Get Stripe credentials for API calls (optional for webhook receiving)
      const stripeService = await getStripeCredentials();

      // Handle payment_intent.succeeded event
      if (event.type === 'payment_intent.succeeded' || event.type === 'charge.succeeded') {
        const paymentIntent = event.data.object;
        // Get the Stripe invoice ID from the payment intent
        const stripeInvoiceId = paymentIntent.invoice;

        if (!stripeInvoiceId) {
          return res.json({ received: true, message: "No invoice associated" });
        }

        // If we have Stripe service, fetch the invoice to get metadata
        let invoiceId = null;
        if (stripeService) {
          try {
            const stripeInvoice = await stripeService.getInvoice(stripeInvoiceId);
            invoiceId = stripeInvoice.metadata?.invoiceId;
          } catch (err) {
            console.error("Error fetching Stripe invoice:", err);
          }
        }

        // Fallback: Try to find invoice by Stripe invoice ID in our database
        if (!invoiceId) {
          const invoice = await invoiceRepository.getInvoiceByStripeInvoiceId(stripeInvoiceId);
          if (invoice) {
            invoiceId = invoice.id;
          }
        }

        // If still no invoice ID, try parsing from description
        if (!invoiceId && paymentIntent.description) {
          const match = paymentIntent.description.match(/Invoice\s+([A-Z0-9-]+)/i);
          if (match) {
            const invoiceNumber = match[1];
            const invoice = await invoiceRepository.getInvoiceByNumber(invoiceNumber);
            if (invoice) {
              invoiceId = invoice.id;
            }
          }
        }

        if (!invoiceId) {
          return res.json({ received: true, message: "Invoice not found" });
        }

        // Update invoice status
        await invoiceRepository.updateInvoice(invoiceId, {
          status: 'paid',
          paymentMethod: 'stripe',
          paymentReference: paymentIntent.id,
          paidAt: new Date()
        });

        // Create payment transaction
        await invoiceRepository.createPaymentTransaction({
          invoiceId,
          amount: (paymentIntent.amount / 100).toString(),
          paymentMethod: 'stripe',
          paymentReference: paymentIntent.id,
          status: 'completed',
          metadata: paymentIntent
        });

        // Sync to QuickBooks if configured
        const invoice = await invoiceRepository.getInvoice(invoiceId);
        const qbService = await getQuickBooksCredentials();
        if (qbService && invoice?.qbInvoiceId) {
          try {
            await qbService.markInvoiceAsPaid(invoice.qbInvoiceId, paymentIntent.amount / 100);
          } catch (qbError) {
            console.error("QB payment sync error in webhook:", qbError);
          }
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // =====================================================
  // TAXJAR
  // =====================================================

  static async calculateTax(req: Request, res: Response) {
    try {
      const taxService = await getTaxJarCredentials();
      if (!taxService) return res.status(400).json({ message: "TaxJar not configured" });

      const tax = await taxService.calculateTax(req.body);
      res.json(tax);
    } catch (error) {
      res.status(500).json({ message: String(error) });
    }
  }
}
