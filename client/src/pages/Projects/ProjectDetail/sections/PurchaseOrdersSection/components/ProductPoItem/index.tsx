import { Package } from "lucide-react";
import type { EnrichedOrderItem } from "@/types/project-types";
import type { OrderItemLine } from "@shared/schema";

interface Charge {
  id: string;
  description?: string;
  chargeName?: string;
  chargeCategory?: string;
  netCost?: string;
  amount?: string;
  quantity?: number;
  includeInUnitPrice?: boolean;
  artworkName?: string;
  [key: string]: unknown;
}

export interface ProductPoItemProps {
  item: EnrichedOrderItem;
  lines: OrderItemLine[];
  runCharges: Charge[];
  fixedCharges: Charge[];
  artworkCharges: Charge[];
  isLast: boolean;
}

export default function ProductPoItem({
  item, lines, runCharges, fixedCharges, artworkCharges, isLast,
}: ProductPoItemProps) {
  return (
    <div className={`px-6 py-3 ${!isLast ? "border-b" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{item.productName || "Product"}</span>
          <span className="text-xs text-blue-600">{item.productSku || ""}</span>
        </div>
      </div>

      {lines.length > 0 ? (
        <div className="border rounded bg-white overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-2 font-medium">Color</th>
                <th className="text-left p-2 font-medium">Size</th>
                <th className="text-right p-2 font-medium">Qty</th>
                <th className="text-right p-2 font-medium">Cost</th>
                <th className="text-right p-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const qty = l.quantity || 0;
                const cost = parseFloat(l.cost || "0");
                return (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="p-2">{l.color || "--"}</td>
                    <td className="p-2">{l.size || "--"}</td>
                    <td className="p-2 text-right font-medium">{qty}</td>
                    <td className="p-2 text-right">${cost.toFixed(2)}</td>
                    <td className="p-2 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs text-gray-500 flex gap-4 ml-6">
          <span>Qty: <strong>{item.quantity}</strong></span>
          <span>Cost: <strong>${parseFloat(item.cost || item.unitPrice || "0").toFixed(2)}</strong></span>
          {item.color && <span>Color: {item.color}</span>}
        </div>
      )}

      {(runCharges.length > 0 || fixedCharges.length > 0 || artworkCharges.length > 0) && (
        <div className="mt-2 space-y-1.5 ml-6">
          {runCharges.map((c) => {
            const cost = parseFloat(c.netCost || c.amount || "0");
            const qty = item.quantity || 1;
            return (
              <div key={c.id} className="flex items-center justify-between text-xs bg-blue-50 border border-blue-100 rounded px-3 py-1.5">
                <span className="text-blue-700">{c.description} <span className="text-blue-400">(per unit)</span></span>
                <span className="font-medium text-blue-700">${cost.toFixed(2)} × {qty} = ${(cost * qty).toFixed(2)}</span>
              </div>
            );
          })}
          {fixedCharges.map((c) => {
            const cost = parseFloat(c.netCost || c.amount || "0");
            return (
              <div key={c.id} className="flex items-center justify-between text-xs bg-purple-50 border border-purple-100 rounded px-3 py-1.5">
                <span className="text-purple-700">{c.description} <span className="text-purple-400">(one-time)</span></span>
                <span className="font-medium text-purple-700">${cost.toFixed(2)}</span>
              </div>
            );
          })}
          {artworkCharges.map((c) => {
            const cost = parseFloat(c.netCost || c.amount || "0");
            const qty = c.chargeCategory === "run" ? (item.quantity || 1) : (c.quantity || 1);
            return (
              <div key={c.id} className="flex items-center justify-between text-xs bg-amber-50 border border-amber-100 rounded px-3 py-1.5">
                <span className="text-amber-700">{c.chargeName || c.description} <span className="text-amber-400">({c.artworkName})</span></span>
                <span className="font-medium text-amber-700">${cost.toFixed(2)}{c.chargeCategory === "run" ? ` × ${qty} = $${(cost * qty).toFixed(2)}` : ""}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
