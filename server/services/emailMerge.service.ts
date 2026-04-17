/**
 * Server-side merge-tag resolver.
 * Replaces <span data-merge-tag="KEY">{{KEY}}</span> and bare {{KEY}} patterns
 * with actual values loaded from the database.
 */
import type { Request } from "express";
import { projectRepository } from "../repositories/project.repository";
import { companyRepository } from "../repositories/company.repository";
import { contactRepository } from "../repositories/contact.repository";
import { invoiceRepository } from "../repositories/invoice.repository";
import type { MergeField } from "@shared/email-merge-fields";
import { getMergeFields } from "@shared/email-merge-fields";

// ── Context types ──────────────────────────────────────────────
export type MergeContext =
  | { type: "invoice"; orderId: string; invoiceId: string }
  | { type: "quote"; orderId: string; approvalToken?: string }
  | { type: "sales_order"; orderId: string; approvalToken?: string }
  | { type: "purchase_order"; orderId: string; documentId: string; confirmationToken?: string }
  | { type: "presentation"; orderId: string; shareToken?: string }
  | { type: "proof"; orderId: string; artworkApprovalToken?: string }
  | { type: "shipping"; orderId: string; shipmentId: string }
  | { type: "generic"; orderId?: string };

// ── Helpers ────────────────────────────────────────────────────
function baseUrl(req: Request): string {
  const proto = req.protocol || "https";
  const host = req.get("host") || "localhost";
  return `${proto}://${host}`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;font-family:Arial,sans-serif;mso-padding-alt:12px 28px;">${label}</a>`;
}

function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!trackingNumber) return null;
  const urls: Record<string, string> = {
    UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  return urls[carrier || ""] || null;
}

// ── Build values map for a given context ───────────────────────
async function buildMergeValues(
  ctx: MergeContext,
  req: Request,
): Promise<Record<string, string>> {
  const values: Record<string, string> = {};
  const base = baseUrl(req);

  // Load order (shared across most types)
  const orderId = "orderId" in ctx ? ctx.orderId : undefined;
  const order = orderId ? await projectRepository.getOrder(orderId) : undefined;

  if (order) {
    values.orderNumber = order.orderNumber || "";

    // Company
    if (order.companyId) {
      const company = await companyRepository.getById(order.companyId);
      if (company) values.companyName = company.name || "";
    }

    // Contact
    if (order.contactId) {
      const contact = await contactRepository.getById(order.contactId);
      if (contact) {
        values.recipientName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
        values.recipientFirstName = contact.firstName || "";
      }
    }
  }

  // Sender — from req.user if available
  const user = req.user as any;
  if (user) {
    values.senderName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
  }

  // Context-specific values
  switch (ctx.type) {
    case "invoice": {
      const invoice = await invoiceRepository.getInvoice(ctx.invoiceId);
      if (invoice) {
        values.invoiceNumber = invoice.invoiceNumber || "";
        values.totalAmount = invoice.totalAmount
          ? `$${Number(invoice.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : "";
        values.dueDate = invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "";
        if (invoice.stripeInvoiceUrl) {
          values.stripePaymentLink = invoice.stripeInvoiceUrl;
        }
        if (invoice.stripeInvoicePdfUrl) {
          values.invoicePdfLink = invoice.stripeInvoicePdfUrl;
        }
      }
      break;
    }

    case "quote": {
      if (ctx.approvalToken) {
        values.approvalLink = ctaButton(`${base}/client-approval/${ctx.approvalToken}`, "Review & Approve Quote");
      }
      break;
    }

    case "sales_order": {
      if (ctx.approvalToken) {
        values.approvalLink = ctaButton(`${base}/client-approval/${ctx.approvalToken}`, "Review & Approve Sales Order");
      }
      break;
    }

    case "purchase_order": {
      // Load document for PO number + vendor info
      const { documentRepository } = await import("../repositories/document.repository");
      const docs = orderId ? await documentRepository.getByOrderId(orderId) : [];
      const poDoc = docs.find((d: any) => d.id === ctx.documentId);
      if (poDoc) {
        values.poNumber = poDoc.documentNumber || "";
        values.vendorName = poDoc.vendorName || "";
        // Vendor contact from metadata if available
        values.vendorContactName = (poDoc.metadata as any)?.vendorContactName || poDoc.vendorName || "";
      }
      if (order) {
        values.supplierInHandsDate = order.supplierInHandsDate
          ? new Date(order.supplierInHandsDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "";
      }
      if (ctx.confirmationToken) {
        values.poConfirmationLink = `${base}/po-confirmation/${ctx.confirmationToken}`;
      }
      break;
    }

    case "presentation": {
      if (ctx.shareToken) {
        values.presentationLink = `${base}/presentation/${ctx.shareToken}`;
      }
      break;
    }

    case "proof": {
      if (ctx.artworkApprovalToken) {
        values.artworkApprovalLink = `${base}/approval/${ctx.artworkApprovalToken}`;
      }
      break;
    }

    case "shipping": {
      const { shipmentService } = await import("./shipment.service");
      const shipments = orderId ? await shipmentService.getByOrderId(orderId) : [];
      const shipment = shipments.find((s: any) => s.id === ctx.shipmentId);
      if (shipment) {
        values.carrier = shipment.carrier || "";
        values.method = shipment.shippingMethod || "";
        values.trackingNumber = shipment.trackingNumber || "";
        // Derive tracking URL from carrier + tracking number
        const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);
        if (trackingUrl) {
          values.trackingUrl = ctaButton(trackingUrl, "Track Package");
        }
      }
      // Product names from order items
      if (orderId) {
        const items = await projectRepository.getOrderItems(orderId);
        values.productNames = items.map((i: any) => i.productName || i.name || "").filter(Boolean).join(", ");
      }
      // CSR name = sender
      values.csrName = values.senderName || "";
      break;
    }

    case "generic":
      // Only base fields (already populated above)
      break;
  }

  return values;
}

// ── Main resolver ──────────────────────────────────────────────
export async function resolveMergeTags(
  html: string,
  ctx: MergeContext,
  req: Request,
): Promise<string> {
  const values = await buildMergeValues(ctx, req);

  // 1. Replace <span data-merge-tag="KEY">…</span> nodes
  let result = html.replace(
    /<span\s+data-merge-tag="([^"]+)"[^>]*>.*?<\/span>/g,
    (_match, key: string) => {
      if (key in values) return values[key];
      console.warn(`[emailMerge] Unknown merge tag: ${key}`);
      return "";
    },
  );

  // 2. Replace bare {{KEY}} occurrences (belt-and-suspenders for legacy/manual)
  result = result.replace(
    /\{\{(\w+)\}\}/g,
    (_match, key: string) => {
      if (key in values) return values[key];
      console.warn(`[emailMerge] Unknown bare merge tag: {{${key}}}`);
      return "";
    },
  );

  return result;
}

/** Check if a specific merge tag key was used in the HTML (as data-merge-tag or bare {{KEY}}) */
export function hasMergeTag(html: string, key: string): boolean {
  return (
    html.includes(`data-merge-tag="${key}"`) ||
    html.includes(`{{${key}}}`)
  );
}

/** Get available merge values for a context (for preview endpoint) */
export { buildMergeValues };
