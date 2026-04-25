import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Eye, EyeOff, Package } from "lucide-react";
import type { OrderItemLine } from "@shared/schema";
import { calcMargin, marginColor } from "../../hooks";

interface DetailedViewProps {
  items: any[];
  hidePricing: boolean;
  onEdit: (item: any) => void;
  onPreview: (item: any) => void;
  onToggleVisibility: (id: string) => void;
  onMoveItem: (id: string, dir: "up" | "down") => void;
}

export default function DetailedView({ items, hidePricing, onEdit, onPreview, onToggleVisibility, onMoveItem }: DetailedViewProps) {
  return (
    <div className="space-y-0 border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
        <span />
        <span>Item</span>
        <span className="text-right">Units</span>
        <span className="text-right">Margin</span>
        <span className="text-right">Amount</span>
      </div>

      {items.map((item, idx) => {
        const lines: OrderItemLine[] = item.lines || [];
        const hasLines = lines.length > 0;
        const cost = Number(item.cost || 0);
        const price = Number(item.unitPrice || 0);
        const itemMargin = calcMargin(cost, price);

        return (
          <div key={item.id} className={`border-b last:border-b-0 bg-white ${!item.isVisible ? "opacity-50" : ""}`}>
            {/* Main product row */}
            <div className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 px-4 py-3 items-center">
              {/* Reorder + Visibility controls */}
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <button
                  onClick={() => onMoveItem(item.id, "up")}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onToggleVisibility(item.id)}
                  className="text-gray-400 hover:text-gray-600"
                  title={item.isVisible ? "Hide from client" : "Show to client"}
                >
                  {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                </button>
                <button
                  onClick={() => onMoveItem(item.id, "down")}
                  disabled={idx === items.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="flex gap-3 items-center">
                <div className="w-16 h-16 flex items-center flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative" onClick={() => onPreview(item)}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                  )}
                  {!item.isVisible && (
                    <div className="absolute inset-0 bg-gray-800/30 flex items-center justify-center">
                      <EyeOff className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                  <p className="text-xs text-teal-600">{item.supplierName || "Unknown Supplier"}</p>
                  <p className="text-sm font-medium cursor-pointer hover:text-teal-700" onClick={() => onPreview(item)}>
                    {item.productName || "Unnamed Product"}
                    {!item.isVisible && <span className="text-xs text-red-400 ml-2">(Hidden)</span>}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    <Button size="sm" variant="default" className="h-8 px-2 font-semibold text-xs bg-secondary text-primary" onClick={() => onEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="default" className="h-8 px-2 font-semibold text-xs bg-primary" onClick={() => onPreview(item)}>
                      View
                    </Button>
                  </div>
                </div>
              </div>
              {!hasLines ? (
                <>
                  <span className="text-sm text-right">{item.quantity}</span>
                  <span className={`text-sm text-right font-medium ${marginColor(itemMargin)}`}>
                    {hidePricing ? "-" : `${itemMargin.toFixed(2)}%`}
                  </span>
                  <span className="text-sm text-right font-semibold">
                    {hidePricing ? "-" : `$${price.toFixed(2)}`}
                  </span>
                </>
              ) : (
                <><span /><span /><span /></>
              )}
            </div>

            {/* Item Lines (pricing tiers) */}
            {hasLines && (
              <div className="px-4 pb-3">
                {lines.map((line: OrderItemLine) => {
                  const lineCost = Number(line.cost || 0);
                  const linePrice = Number(line.unitPrice || 0);
                  const lineMargin = calcMargin(lineCost, linePrice);
                  return (
                    <div key={line.id} className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 py-1">
                      <span /><span />
                      <span className="text-sm text-right">{line.quantity}</span>
                      <span className={`text-sm text-right font-medium ${marginColor(lineMargin)}`}>
                        {hidePricing ? "-" : `${lineMargin.toFixed(2)}%`}
                      </span>
                      <span className="text-sm text-right font-semibold">
                        {hidePricing ? "-" : `$${linePrice.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product description */}
            {item.description && (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-500 line-clamp-3">{item.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
