/**
 * Shared utilities and helpers for Project Detail sections
 */

// ── TYPE DEFINITIONS ──

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

// ── MARGIN CALCULATIONS ──

/**
 * Calculate margin percentage from cost and price
 * margin = (price - cost) / price * 100
 */
export function calcMarginPercent(cost: number, price: number): number {
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

// ── FORMS & DIALOGS ──

/**
 * Format item for document generation (Quote, SO, Invoice, PO templates).
 * Shared across QuoteSection, SalesOrderSection, InvoiceSection, PurchaseOrdersSection.
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
