import type { MergeField } from "./types";

/** Replace `{{mergeField}}` placeholders with actual values. */
export function applyTemplate(
  template: { subject: string; body: string },
  mergeData: Record<string, string>,
): { subject: string; body: string } {
  const replace = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => mergeData[key] || "");
  return { subject: replace(template.subject), body: replace(template.body) };
}

export const TEMPLATE_MERGE_FIELDS: Record<string, MergeField[]> = {
  quote: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
  ],
  sales_order: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
  ],
  invoice: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
    { key: "invoiceNumber", label: "Invoice Number" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "dueDate", label: "Due Date" },
    { key: "stripePaymentLink", label: "Stripe Payment Link" },
  ],
  purchase_order: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "vendorName", label: "Vendor Name" },
    { key: "vendorContactName", label: "Vendor Contact" },
    { key: "orderNumber", label: "Order Number" },
    { key: "poNumber", label: "PO Number" },
    { key: "supplierInHandsDate", label: "In-Hands Date" },
  ],
  presentation: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
  ],
  proof: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "artworkList", label: "Artwork List" },
  ],
  shipping_notification: [
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "companyName", label: "Company Name" },
    { key: "productNames", label: "Product Names" },
    { key: "carrier", label: "Carrier" },
    { key: "method", label: "Shipping Method" },
    { key: "trackingNumber", label: "Tracking Number" },
    { key: "trackingUrl", label: "Tracking URL" },
    { key: "csrName", label: "CSR Name" },
  ],
};

export const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  quote: "Quote",
  sales_order: "Sales Order",
  invoice: "Invoice",
  purchase_order: "Purchase Order",
  presentation: "Presentation",
  proof: "Proof",
  shipping_notification: "Shipping Notification",
};
