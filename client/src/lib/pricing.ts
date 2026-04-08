/**
 * pricing.ts — Single source of truth for all pricing calculations.
 *
 * Every order item has 3 cost/revenue layers:
 *   1. Product (size/color lines)     → productSellTotal / productCostTotal
 *   2. Charges (setup fees, etc.)     → chargeSellTotal  / chargeCostTotal
 *   3. Decoration (artwork imprint)   → decoSellTotal    / decoCostTotal
 *
 * Grand total = Product + Charges + Decoration
 *
 * See docs/pricing-calculation-spec.md for worked examples.
 */

// ─── Input Types (match DB field shapes) ───────────────────────────

/** One size/color line of an order item (from orderItemLines table) */
export interface PricingLine {
  quantity: number;      // how many units of this color/size
  cost: number;          // cost per unit (what we pay supplier)
  unitPrice: number;     // sell price per unit (what client pays)
}

/** A product-level charge (from orderAdditionalCharges table) */
export interface ProductCharge {
  amount: string;                   // legacy sell price field
  retailPrice?: string | null;      // preferred sell price (overrides amount)
  netCost?: string | null;          // what we pay for this charge
  chargeCategory?: string | null;   // "run" = per unit, "fixed" = one-time
  quantity?: number | null;         // for fixed charges: how many times
  includeInUnitPrice?: boolean;     // true = already baked into line unitPrice
  displayToClient?: boolean;        // false = hidden/absorbed charge
}

/** A decoration/artwork charge (from artworkCharges table) */
export interface DecorationCharge {
  retailPrice: string;              // sell price per unit/occurrence
  netCost?: string | null;          // our cost
  chargeCategory: string;           // "run" = per unit, "fixed" = one-time
  quantity?: number | null;         // for fixed: how many
  displayMode?: string | null;      // "display_to_client" = visible on invoice
}

// ─── Output Types ──────────────────────────────────────────────────

/** Product lines subtotal (before any charges) */
export interface ProductSubtotal {
  totalQty: number;            // total units across all lines
  productCostTotal: number;    // SUM(line.qty × line.cost)
  productSellTotal: number;    // SUM(line.qty × line.unitPrice)
}

/** Charge subtotal (product-level charges like Setup, Shipping, etc.) */
export interface ChargeSubtotal {
  chargeSellTotal: number;     // total charge revenue (visible to client)
  chargeCostTotal: number;     // total charge cost (our expense)
}

/** Decoration subtotal (artwork imprint charges) */
export interface DecorationSubtotal {
  decoSellTotal: number;       // total decoration revenue
  decoCostTotal: number;       // total decoration cost
}

/** Complete item pricing breakdown — everything in one place */
export interface ItemPricingBreakdown {
  // Product (lines)
  totalQty: number;
  productSellTotal: number;
  productCostTotal: number;

  // Charges (setup fees, etc.)
  chargeSellTotal: number;
  chargeCostTotal: number;

  // Decoration (artwork imprint charges)
  decoSellTotal: number;
  decoCostTotal: number;

  // Grand totals (product + charges + decoration)
  itemSellGrandTotal: number;   // what client pays for this item
  itemCostGrandTotal: number;   // what we pay for this item
  itemProfitTotal: number;      // sell - cost
  itemMarginPercent: number;    // profit / sell × 100
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Safe parse a string/number to float, defaulting to 0 */
function num(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Get sell price from a charge.
 * retailPrice takes priority over legacy amount field.
 */
export function getChargeSellPrice(charge: { retailPrice?: string | null; amount?: string | null }): number {
  return num(charge.retailPrice ?? charge.amount);
}

/**
 * Get effective quantity for a charge based on its category.
 *   - Run charge (per unit):  uses itemQty
 *   - Fixed charge (one-time): uses charge's own quantity (default 1)
 */
export function getChargeEffectiveQty(
  charge: { chargeCategory?: string | null; quantity?: number | null },
  itemQty: number,
): number {
  if (charge.chargeCategory === "run") return itemQty;
  return charge.quantity || 1;
}

/**
 * Calculate margin % safely.
 * Returns 0 when sellTotal is 0 (avoids NaN/Infinity).
 */
export function calcMarginPercent(sellTotal: number, costTotal: number): number {
  if (sellTotal <= 0) return 0;
  return ((sellTotal - costTotal) / sellTotal) * 100;
}

// ─── Core Functions ────────────────────────────────────────────────

/**
 * Calculate product lines subtotal.
 *
 * If lines exist, sums across all lines.
 * If no lines, falls back to item-level quantity/cost/unitPrice.
 */
export function getProductSubtotal(
  lines: PricingLine[],
  fallbackItem?: { quantity?: number | null; cost?: string | number | null; unitPrice?: string | number | null },
): ProductSubtotal {
  if (lines.length > 0) {
    let totalQty = 0;
    let productCostTotal = 0;
    let productSellTotal = 0;

    for (const line of lines) {
      const qty = line.quantity || 0;
      totalQty += qty;
      productCostTotal += qty * (line.cost || 0);
      productSellTotal += qty * (line.unitPrice || 0);
    }

    return { totalQty, productCostTotal, productSellTotal };
  }

  // Fallback: item-level pricing (no size/color breakdown)
  const qty = fallbackItem?.quantity || 0;
  return {
    totalQty: qty,
    productCostTotal: qty * num(fallbackItem?.cost),
    productSellTotal: qty * num(fallbackItem?.unitPrice),
  };
}

/**
 * Calculate charge subtotal for product-level charges.
 *
 * Sell total: only charges visible to client AND not baked into unit price.
 * Cost total: ALL charges (including absorbed/hidden ones count as our cost).
 */
export function getChargeSubtotal(charges: ProductCharge[], itemQty: number): ChargeSubtotal {
  let chargeSellTotal = 0;
  let chargeCostTotal = 0;

  for (const c of charges) {
    const effectiveQty = getChargeEffectiveQty(c, itemQty);
    const sellPrice = getChargeSellPrice(c);
    const costPrice = num(c.netCost);

    // Sell: only visible, non-baked-in charges
    if (!c.includeInUnitPrice && c.displayToClient !== false) {
      chargeSellTotal += sellPrice * effectiveQty;
    }

    // Cost: ALL charges count (even hidden/absorbed ones are our expense)
    chargeCostTotal += costPrice * effectiveQty;
  }

  return { chargeSellTotal, chargeCostTotal };
}

/**
 * Calculate decoration subtotal for artwork charges.
 *
 * Sell total: only charges with displayMode = "display_to_client".
 * Cost total: ALL decoration charges.
 */
export function getDecorationSubtotal(decoCharges: DecorationCharge[], itemQty: number): DecorationSubtotal {
  let decoSellTotal = 0;
  let decoCostTotal = 0;

  for (const c of decoCharges) {
    const effectiveQty = getChargeEffectiveQty(c, itemQty);
    const sellPrice = num(c.retailPrice);
    const costPrice = num(c.netCost);

    // Sell: only client-visible decoration charges
    if (c.displayMode === "display_to_client") {
      decoSellTotal += sellPrice * effectiveQty;
    }

    // Cost: ALL decoration charges
    decoCostTotal += costPrice * effectiveQty;
  }

  return { decoSellTotal, decoCostTotal };
}

/**
 * One call to get complete pricing breakdown for an order item.
 *
 * Combines product lines + charges + decoration into a single result
 * with grand totals and margin.
 */
export function getItemPricing(
  lines: PricingLine[],
  charges: ProductCharge[],
  decoCharges: DecorationCharge[],
  fallbackItem?: { quantity?: number | null; cost?: string | number | null; unitPrice?: string | number | null },
): ItemPricingBreakdown {
  const product = getProductSubtotal(lines, fallbackItem);
  const charge = getChargeSubtotal(charges, product.totalQty);
  const deco = getDecorationSubtotal(decoCharges, product.totalQty);

  const itemSellGrandTotal = product.productSellTotal + charge.chargeSellTotal + deco.decoSellTotal;
  const itemCostGrandTotal = product.productCostTotal + charge.chargeCostTotal + deco.decoCostTotal;
  const itemProfitTotal = itemSellGrandTotal - itemCostGrandTotal;
  const itemMarginPercent = calcMarginPercent(itemSellGrandTotal, itemCostGrandTotal);

  return {
    totalQty: product.totalQty,
    productSellTotal: product.productSellTotal,
    productCostTotal: product.productCostTotal,
    chargeSellTotal: charge.chargeSellTotal,
    chargeCostTotal: charge.chargeCostTotal,
    decoSellTotal: deco.decoSellTotal,
    decoCostTotal: deco.decoCostTotal,
    itemSellGrandTotal,
    itemCostGrandTotal,
    itemProfitTotal,
    itemMarginPercent,
  };
}
