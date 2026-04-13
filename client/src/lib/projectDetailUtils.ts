/**
 * Shared utilities and helpers for Project Detail sections
 * This centralizes calculations, formatting, and constants to prevent duplication
 */

import { type MarginSettings } from "@/types/margin-types";
import { marginColorClass, marginBgClass } from "@/hooks/useMarginSettings";

/**
 * Naming convention for project detail fields:
 * - order.margin = order-level default margin (from DB)
 * - line.margin = line-level margin calculation (from OrderItemLine)
 * - marginSettings.minimumMargin = company minimum threshold
 * - marginSettings.defaultMargin = company default for new items
 * - Computed properties always prefix context: `editDialogMargin`, `itemMargin`, `lineMargin`
 */

// ── TYPE DEFINITIONS ──

export interface OrderTotals {
  orderProductSell: number;
  orderChargeSell: number;
  orderDecoSell: number;
  orderCostTotal: number;
  orderQtyTotal: number;
  // Backward-compat aliases
  subtotal: number;
  totalCost: number;
  totalQty: number;
  totalCharges: number;
}

export interface PricingTotals {
  qty: number;
  cost: number;
  revenue: number;
}

// ── MARGIN CALCULATIONS ──

/**
 * Calculate margin percentage from cost and price
 * margin = (price - cost) / price * 100
 */
export function calcMarginPercent(cost: number, price: number): number {
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

/**
 * Get margin color class based on settings
 * Delegates to useMarginSettings utility
 */
export function getMarginColor(margin: number, marginSettings: MarginSettings): string {
  return marginColorClass(margin, marginSettings);
}

/**
 * Get margin background class based on settings
 * Delegates to useMarginSettings utility
 */
export function getMarginBg(margin: number, marginSettings: MarginSettings): string {
  return marginBgClass(margin, marginSettings);
}

// ── PRICING UTILITIES ──

/**
 * Calculate totals from pricing lines
 * For local state during editing
 */
export function calculatePricingTotals(
  lines: Array<{ quantity: number; cost: number; unitPrice: number }>
): PricingTotals {
  return lines.reduce(
    (acc, l) => ({
      qty: acc.qty + (l.quantity || 0),
      cost: acc.cost + (l.quantity || 0) * (l.cost || 0),
      revenue: acc.revenue + (l.quantity || 0) * (l.unitPrice || 0),
    }),
    { qty: 0, cost: 0, revenue: 0 }
  );
}

/**
 * Calculate margin from totals
 */
export function calculateMarginFromTotals(totals: PricingTotals): number {
  return totals.revenue > 0 ? ((totals.revenue - totals.cost) / totals.revenue) * 100 : 0;
}

/**
 * Calculate margin from lines directly
 */
export function calculateMarginFromLines(
  lines: Array<{ quantity: number; cost: number; unitPrice: number }>
): number {
  const totals = calculatePricingTotals(lines);
  return calculateMarginFromTotals(totals);
}

// ── ORDER TOTALS ──

/**
 * Calculate overall order margin from order totals
 * This is the margin that appears in the Products header
 */
export function calculateOrderMargin(
  productSell: number,
  chargeSell: number,
  decoSell: number,
  costTotal: number
): number {
  const totalSell = productSell + chargeSell + decoSell;
  return totalSell > 0 ? ((totalSell - costTotal) / totalSell) * 100 : 0;
}

// ── FIELD NAMING CONSTANTS ──

/**
 * Canonical field names used throughout project detail
 * Use these constants to avoid typos and maintain consistency
 */
export const PROJECT_FIELD_NAMES = {
  // Order-level fields
  margin: "margin",
  assignedUserId: "assignedUserId",
  csrUserId: "csrUserId",
  salesOrderStatus: "salesOrderStatus",
  presentationStatus: "presentationStatus",
  quoteStatus: "quoteStatus",
  businessStage: "businessStage",
  
  // Addresses
  billingAddress: "billingAddress",
  shippingAddress: "shippingAddress",
  
  // Dates
  inHandsDate: "inHandsDate",
  eventDate: "eventDate",
  supplierInHandsDate: "supplierInHandsDate",
} as const;

/**
 * Section context types
 */
export type SectionContext = 
  | "overview"
  | "presentation"
  | "quote"
  | "salesOrder"
  | "shipping"
  | "products"
  | "invoice"
  | "purchase_orders"
  | "bills"
  | "collaborate"
  | "feedback";

// ── ACTIVITY LOG CONSTANTS ──

/**
 * Activity types for project changes
 * Use these consistently when logging activities
 */
export const ACTIVITY_TYPES = {
  STATUS_CHANGE: "status_change",
  FIELD_UPDATE: "field_update",
  SECTION_UNLOCK: "system_action",
  COMMENT: "comment",
  FILE_UPLOAD: "file_upload",
} as const;

// ── LOCK STATUS ──

/**
 * Auto-lock rules by stage/status
 * Reference for lock banner and access control
 */
export const LOCK_RULES = {
  quote: {
    lockedWhen: "businessStage >= sales_order",
    unlockable: true,
    message: "Locked when project advances to Sales Order stage",
  },
  salesOrder: {
    lockedWhen: "salesOrderStatus === ready_to_invoice",
    unlockable: true,
    message: "Locked when marked Ready to Invoice",
  },
  invoice: {
    lockedWhen: "invoice.status === paid",
    unlockable: true,
    message: "Locked when invoice is marked Paid",
  },
} as const;

// ── FORMS & DIALOGS ──

/**
 * Format order data for edit forms
 * Ensures consistent property access across sections
 */
export function formatOrderForEdit(order: any) {
  return {
    id: order?.id,
    orderNumber: order?.orderNumber,
    margin: order?.margin || "",
    businessStage: order?.businessStage,
    salesOrderStatus: order?.salesOrderStatus,
    presentationStatus: order?.presentationStatus,
    quoteStatus: order?.quoteStatus,
    notes: order?.notes || "",
    inHandsDate: order?.inHandsDate || "",
    eventDate: order?.eventDate || "",
    supplierInHandsDate: order?.supplierInHandsDate || "",
  };
}

/**
 * Format item data for edit dialogs
 */
export function formatItemForEdit(item: any) {
  return {
    id: item?.id,
    productId: item?.productId,
    productName: item?.productName,
    productSku: item?.productSku,
    supplierId: item?.supplierId,
    color: item?.color || "",
    quantity: item?.quantity || 0,
    cost: parseFloat(item?.cost || "0"),
    unitPrice: parseFloat(item?.unitPrice || "0"),
    description: item?.description || "",
    notes: item?.notes || "",
    privateNotes: item?.privateNotes || "",
    imprintMethod: item?.imprintMethod || "",
    imprintLocation: item?.imprintLocation || "",
  };
}

/**
 * Format item for document generation (Quote, SO, Invoice, PO templates).
 * Shared across QuoteSection, SalesOrderSection, InvoiceSection, PurchaseOrdersSection.
 * Replaces the 4 duplicated `getEditedItem` functions that had a hardcoded `margin: 44`.
 */
export function getEditedItem(_id: string, item: any) {
  const cost = parseFloat(item.cost || 0);
  const unitPrice = parseFloat(item.unitPrice) || 0;
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    supplierId: item.supplierId,
    color: item.color || "",
    quantity: item.quantity || 0,
    unitPrice,
    cost,
    decorationCost: parseFloat(item.decorationCost || 0),
    charges: parseFloat(item.charges || 0),
    margin: calcMarginPercent(cost, unitPrice),
    sizePricing: item.sizePricing || {},
  };
}
