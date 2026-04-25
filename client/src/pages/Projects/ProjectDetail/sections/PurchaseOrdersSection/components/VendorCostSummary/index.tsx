import type { EnrichedOrderItem } from "@/types/project-types";
import type { OrderItemLine } from "@shared/schema";

export interface VendorCostSummaryProps {
  items: EnrichedOrderItem[];
  allItemCharges: Record<string, Array<Record<string, unknown>>>;
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
  allArtworkCharges: Record<string, Array<Record<string, unknown>>>;
  lines: Record<string, OrderItemLine[]>;
}

export default function VendorCostSummary({
  items, allItemCharges, allArtworkItems, allArtworkCharges, lines,
}: VendorCostSummaryProps) {
  let productSubtotal = 0;
  let runChargesTotal = 0;
  let fixedChargesTotal = 0;
  let artworkChargesTotal = 0;

  items.forEach((item) => {
    const itemLines = lines[item.id] || [];
    if (itemLines.length > 0) {
      itemLines.forEach((l) => { productSubtotal += (l.quantity || 0) * parseFloat(l.cost || "0"); });
    } else {
      productSubtotal += (item.quantity || 0) * parseFloat(item.cost || item.unitPrice || "0");
    }
    (allItemCharges[item.id] || []).forEach((c: Record<string, unknown>) => {
      const cost = parseFloat((c.netCost as string) || (c.amount as string) || "0");
      if (c.chargeCategory === "run") {
        runChargesTotal += cost * (item.quantity || 1);
      } else {
        fixedChargesTotal += cost * ((c.quantity as number) || 1);
      }
    });
    (allArtworkItems[item.id] || []).forEach((art: Record<string, unknown>) => {
      (allArtworkCharges[art.id as string] || []).forEach((c: Record<string, unknown>) => {
        const cost = parseFloat((c.netCost as string) || (c.amount as string) || "0");
        const qty = c.chargeCategory === "run" ? (item.quantity || 1) : ((c.quantity as number) || 1);
        artworkChargesTotal += cost * qty;
      });
    });
  });

  const vendorTotal = productSubtotal + runChargesTotal + fixedChargesTotal + artworkChargesTotal;
  const hasCharges = runChargesTotal > 0 || fixedChargesTotal > 0 || artworkChargesTotal > 0;

  if (!hasCharges) return null;

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Product Subtotal</span>
          <span className="font-medium">${productSubtotal.toFixed(2)}</span>
        </div>
        {runChargesTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-blue-600">Run Charges</span>
            <span className="font-medium text-blue-600">${runChargesTotal.toFixed(2)}</span>
          </div>
        )}
        {fixedChargesTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-purple-600">Fixed Charges</span>
            <span className="font-medium text-purple-600">${fixedChargesTotal.toFixed(2)}</span>
          </div>
        )}
        {artworkChargesTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-amber-600">Artwork Charges</span>
            <span className="font-medium text-amber-600">${artworkChargesTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-gray-200">
          <span className="font-bold text-gray-900">Vendor Total</span>
          <span className="font-bold text-gray-900">${vendorTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
