import type { MarginSettings } from "@/types/margin-types";

/** Color class for margin text based on dynamic thresholds */
export function marginColorClass(margin: number, settings: MarginSettings): string {
  const m = Math.round(margin * 10) / 10;
  if (m >= settings.defaultMargin) return "text-green-600";
  if (m >= settings.minimumMargin) return "text-yellow-600";
  return "text-red-600";
}

/** Background class for margin summary based on dynamic thresholds */
export function marginBgClass(margin: number, settings: MarginSettings): string {
  const m = Math.round(margin * 10) / 10;
  if (m >= settings.defaultMargin) return "bg-green-50";
  if (m >= settings.minimumMargin) return "bg-yellow-50";
  return "bg-red-50";
}

/** Check if margin is below minimum (rounds to 1 decimal to avoid floating point issues) */
export function isBelowMinimum(margin: number, settings: MarginSettings): boolean {
  const rounded = Math.round(margin * 10) / 10;
  return rounded > 0 && rounded < settings.minimumMargin;
}

/** Calculate margin % from cost and price */
export function calcMarginPercent(cost: number, price: number): number {
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

/**
 * Apply a target margin % — returns new { cost, price }.
 * Bidirectional: derives price from cost when cost > 0, or cost from price when cost = 0.
 */
export function applyMargin(
  cost: number,
  price: number,
  targetMargin: number
): { cost: number; price: number } {
  if (targetMargin <= 0 || targetMargin >= 100) return { cost, price };

  if (cost > 0) {
    // Derive price from cost + margin
    return { cost, price: parseFloat((cost / (1 - targetMargin / 100)).toFixed(4)) };
  }
  if (price > 0) {
    // Derive cost from price + margin
    return { cost: parseFloat((price * (1 - targetMargin / 100)).toFixed(4)), price };
  }
  // Both zero — can't calculate
  return { cost, price };
}
