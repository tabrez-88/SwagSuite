import { invoiceRepository } from "../repositories/invoice.repository";
import { projectRepository } from "../repositories/project.repository";
import { companyRepository } from "../repositories/company.repository";
import { getStripeCredentials } from "../services/stripe.service";

/**
 * Auto-create a Stripe invoice + payment link for a local invoice.
 * Idempotent: skips if invoice already has a stripeInvoiceId.
 * Fails silently (logs error) so it never blocks the main flow.
 */
export async function createStripePaymentForInvoice(invoiceId: string): Promise<void> {
  try {
    const invoice = await invoiceRepository.getInvoice(invoiceId);
    if (!invoice || invoice.stripeInvoiceId) return; // already linked or missing

    const stripeService = await getStripeCredentials();
    if (!stripeService) {
      console.warn("Stripe not configured — skipping auto payment link for invoice", invoiceId);
      return;
    }

    if (!invoice.orderId) return;

    const order = await projectRepository.getOrder(invoice.orderId);
    if (!order || !order.companyId) return;

    const company = await companyRepository.getById(order.companyId);
    if (!company) return;

    // Find or create Stripe customer
    let stripeCustomer = await stripeService.searchCustomer(company.email || `${company.name}@example.com`);
    if (!stripeCustomer) {
      stripeCustomer = await stripeService.createCustomer(
        company.email || `${company.name}@example.com`,
        company.name
      );
    }

    // Calculate days until due
    const daysUntilDue = invoice.dueDate
      ? Math.max(1, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 30;

    // Create draft Stripe invoice
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

    // Subtotal line item
    await stripeService.createInvoiceItem({
      customerId: stripeCustomer.id,
      invoiceId: stripeInvoice.id,
      amount: Math.round(Number(invoice.subtotal) * 100),
      currency: 'usd',
      description: `Order ${order.orderNumber} - Products & Services`
    });

    // Shipping (if > 0)
    if (Number(order.shipping) > 0) {
      await stripeService.createInvoiceItem({
        customerId: stripeCustomer.id,
        invoiceId: stripeInvoice.id,
        amount: Math.round(Number(order.shipping) * 100),
        currency: 'usd',
        description: 'Shipping & Handling'
      });
    }

    // Tax (if > 0)
    if (Number(invoice.taxAmount) > 0) {
      await stripeService.createInvoiceItem({
        customerId: stripeCustomer.id,
        invoiceId: stripeInvoice.id,
        amount: Math.round(Number(invoice.taxAmount) * 100),
        currency: 'usd',
        description: 'Sales Tax (calculated via TaxJar)'
      });
    }

    // Credit Card Processing Fee (3%)
    const invoiceTotal = Math.round(Number(invoice.totalAmount) * 100);
    const ccFeeAmount = Math.round(invoiceTotal * 0.03);
    if (ccFeeAmount > 0) {
      await stripeService.createInvoiceItem({
        customerId: stripeCustomer.id,
        invoiceId: stripeInvoice.id,
        amount: ccFeeAmount,
        currency: 'usd',
        description: 'Credit Card Processing Fee (3%) — waived if paying via ACH/Bank Transfer'
      });
    }

    // Finalize to get hosted URL
    const finalizedInvoice = await stripeService.finalizeInvoice(stripeInvoice.id);

    // Update local invoice with Stripe details
    await invoiceRepository.updateInvoice(invoice.id, {
      stripeInvoiceId: finalizedInvoice.id,
      stripePaymentIntentId: finalizedInvoice.payment_intent,
      stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      stripeInvoicePdfUrl: finalizedInvoice.invoice_pdf
    });

    console.log(`Stripe payment link auto-created for invoice ${invoice.invoiceNumber}: ${finalizedInvoice.hosted_invoice_url}`);
  } catch (error) {
    console.error("Auto Stripe payment link creation failed for invoice", invoiceId, error);
  }
}
