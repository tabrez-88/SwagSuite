/**
 * Shared merge-fields registry — single source of truth for client + server.
 * Client uses it for Lexical typeahead; server uses it for tag resolution.
 */

export type MergeFieldKind = "text" | "link";

export type TemplateType =
  | "quote"
  | "sales_order"
  | "invoice"
  | "purchase_order"
  | "presentation"
  | "proof"
  | "shipping_notification"
  | "generic";

export interface MergeField {
  key: string;
  label: string;
  kind: MergeFieldKind;
  description?: string;
}

export const MERGE_FIELDS_BY_TEMPLATE: Record<TemplateType, MergeField[]> = {
  quote: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "recipientName", label: "Recipient Name", kind: "text" },
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "orderNumber", label: "Order Number", kind: "text" },
    { key: "approvalLink", label: "Approval Link", kind: "link", description: "Client approval button for this quote" },
  ],
  sales_order: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "recipientName", label: "Recipient Name", kind: "text" },
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "orderNumber", label: "Order Number", kind: "text" },
    { key: "approvalLink", label: "Approval Link", kind: "link", description: "Client approval button for this SO" },
  ],
  invoice: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "recipientName", label: "Recipient Name", kind: "text" },
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "orderNumber", label: "Order Number", kind: "text" },
    { key: "invoiceNumber", label: "Invoice Number", kind: "text" },
    { key: "totalAmount", label: "Total Amount", kind: "text" },
    { key: "dueDate", label: "Due Date", kind: "text" },
    { key: "stripePaymentLink", label: "Stripe Payment Link", kind: "link", description: "Stripe hosted payment page" },
    { key: "invoicePdfLink", label: "Invoice PDF Link", kind: "link", description: "Direct link to invoice PDF" },
  ],
  purchase_order: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "vendorName", label: "Vendor Name", kind: "text" },
    { key: "vendorContactName", label: "Vendor Contact", kind: "text" },
    { key: "orderNumber", label: "Order Number", kind: "text" },
    { key: "poNumber", label: "PO Number", kind: "text" },
    { key: "supplierInHandsDate", label: "In-Hands Date", kind: "text" },
    { key: "poConfirmationLink", label: "PO Confirmation Link", kind: "link", description: "Vendor PO confirmation page" },
  ],
  presentation: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "recipientName", label: "Recipient Name", kind: "text" },
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "orderNumber", label: "Order Number", kind: "text" },
    { key: "presentationLink", label: "Presentation Link", kind: "link", description: "Link to view presentation" },
  ],
  proof: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "recipientName", label: "Recipient Name", kind: "text" },
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "artworkList", label: "Artwork List", kind: "text" },
    { key: "artworkApprovalLink", label: "Artwork Approval Link", kind: "link", description: "Client artwork approval page" },
  ],
  shipping_notification: [
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "productNames", label: "Product Names", kind: "text" },
    { key: "carrier", label: "Carrier", kind: "text" },
    { key: "method", label: "Shipping Method", kind: "text" },
    { key: "trackingNumber", label: "Tracking Number", kind: "text" },
    { key: "trackingUrl", label: "Tracking URL", kind: "link", description: "Carrier tracking page" },
    { key: "csrName", label: "CSR Name", kind: "text" },
  ],
  generic: [
    { key: "companyName", label: "Company Name", kind: "text" },
    { key: "senderName", label: "Sender Name", kind: "text" },
    { key: "recipientName", label: "Recipient Name", kind: "text" },
    { key: "recipientFirstName", label: "Recipient First Name", kind: "text" },
    { key: "orderNumber", label: "Order Number", kind: "text" },
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
  generic: "General",
};

/** Get merge fields for a template type, with fallback to generic */
export function getMergeFields(templateType: string): MergeField[] {
  return MERGE_FIELDS_BY_TEMPLATE[templateType as TemplateType] || MERGE_FIELDS_BY_TEMPLATE.generic;
}
