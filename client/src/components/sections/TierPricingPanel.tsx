import { useState, useMemo, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Layers, Plus, Save, Trash2 } from "lucide-react";

export interface PricingTier {
  quantity: number;
  cost: number;
  margin?: number;
  price?: number;
}

interface TierPricingPanelProps {
  tiers: PricingTier[];
  defaultMargin?: number;
  totalQuantity?: number;
  runChargeCostPerUnit?: number;
  editable?: boolean;
  onApplyTier?: (cost: number, price: number) => void;
  onTiersChange?: (tiers: PricingTier[]) => void;
}

function calcPriceFromCost(cost: number, margin: number, runCharge: number = 0): number {
  const eff = cost + runCharge;
  return margin > 0 && margin < 100 ? +(eff / (1 - margin / 100)).toFixed(2) : eff;
}

export default function TierPricingPanel({
  tiers,
  defaultMargin = 40,
  totalQuantity = 0,
  runChargeCostPerUnit = 0,
  editable = false,
  onApplyTier,
  onTiersChange,
}: TierPricingPanelProps) {
  const [localTiers, setLocalTiers] = useState<PricingTier[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const sorted = [...tiers]
      .sort((a, b) => a.quantity - b.quantity)
      .map(t => ({
        quantity: t.quantity,
        cost: t.cost,
        margin: t.margin ?? defaultMargin,
        price: t.price ?? calcPriceFromCost(t.cost, t.margin ?? defaultMargin, runChargeCostPerUnit),
      }));
    setLocalTiers(sorted);
    setIsDirty(false);
  }, [tiers]);

  const displayTiers = editable ? localTiers : [...tiers].sort((a, b) => a.quantity - b.quantity).map(t => ({
    ...t,
    margin: t.margin ?? defaultMargin,
    price: t.price ?? calcPriceFromCost(t.cost, t.margin ?? defaultMargin, runChargeCostPerUnit),
  }));

  const bestMatchIndex = useMemo(() => {
    if (totalQuantity <= 0) return -1;
    let best = -1;
    for (let i = 0; i < displayTiers.length; i++) {
      if (totalQuantity >= displayTiers[i].quantity) best = i;
    }
    return best;
  }, [displayTiers, totalQuantity]);

  const updateTier = useCallback((idx: number, field: keyof PricingTier, value: number) => {
    setLocalTiers(prev => {
      const updated = [...prev];
      const tier = { ...updated[idx] };
      if (field === "cost") {
        tier.cost = value;
        tier.price = calcPriceFromCost(value, tier.margin ?? defaultMargin, runChargeCostPerUnit);
      } else if (field === "margin") {
        tier.margin = value;
        tier.price = calcPriceFromCost(tier.cost, value, runChargeCostPerUnit);
      } else if (field === "price") {
        tier.price = value;
        const eff = tier.cost + runChargeCostPerUnit;
        tier.margin = value > 0 ? +((( value - eff) / value) * 100).toFixed(1) : 0;
      } else {
        tier.quantity = value;
      }
      updated[idx] = tier;
      return updated;
    });
    setIsDirty(true);
  }, [defaultMargin, runChargeCostPerUnit]);

  const addTier = () => {
    const last = localTiers[localTiers.length - 1];
    const cost = last ? +(last.cost * 0.9).toFixed(2) : 0;
    const margin = last?.margin ?? defaultMargin;
    setLocalTiers(prev => [...prev, {
      quantity: last ? Math.round(last.quantity * 2) : 100,
      cost,
      margin,
      price: calcPriceFromCost(cost, margin, runChargeCostPerUnit),
    }]);
    setIsDirty(true);
  };

  const removeTier = (idx: number) => {
    setLocalTiers(prev => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const handleSave = () => {
    const sorted = [...localTiers].sort((a, b) => a.quantity - b.quantity);
    setLocalTiers(sorted);
    onTiersChange?.(sorted);
    setIsDirty(false);
  };

  if (!displayTiers.length && !editable) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-700">Pricing Tiers</span>
          {totalQuantity > 0 && (
            <Badge variant="outline" className="text-[10px] border-gray-300 font-normal">
              {totalQuantity} units
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editable && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addTier}>
              <Plus className="w-3 h-3 mr-1" /> Add Tier
            </Button>
          )}
          {editable && isDirty && (
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
          )}
        </div>
      </div>

      {displayTiers.length > 0 ? (
        <div className="overflow-x-auto">
          {/* Vertical layout: each tier is a row */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-4 py-2 font-medium text-gray-500 w-28">Tier</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 w-24">Qty</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 w-28">Cost</th>
                {runChargeCostPerUnit > 0 && (
                  <th className="text-left px-3 py-2 font-medium text-orange-500 w-24">+ Run</th>
                )}
                <th className="text-left px-3 py-2 font-medium text-gray-500 w-24">Margin</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700 w-28">Price</th>
                {(editable || onApplyTier) && (
                  <th className="text-right px-4 py-2 font-medium text-gray-500 w-20"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayTiers.map((tier, idx) => {
                const isBest = idx === bestMatchIndex;
                return (
                  <tr key={idx} className={`border-b last:border-0 ${isBest ? "bg-green-50/60" : "hover:bg-gray-50/50"}`}>
                    {/* Tier label */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-600">Tier {idx + 1}</span>
                        {isBest && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] px-1.5 py-0">
                            <Check className="w-2.5 h-2.5 mr-0.5" /> Best
                          </Badge>
                        )}
                      </div>
                    </td>
                    {/* Qty */}
                    <td className="px-3 py-2">
                      {editable ? (
                        <div className="relative">
                          <input
                            type="number"
                            className="w-20 h-7 text-xs font-semibold rounded border border-gray-200 bg-white px-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            value={tier.quantity}
                            onChange={(e) => updateTier(idx, "quantity", parseInt(e.target.value) || 0)}
                            min={1}
                          />
                        </div>
                      ) : (
                        <span className="font-semibold">{tier.quantity.toLocaleString()}+</span>
                      )}
                    </td>
                    {/* Cost */}
                    <td className="px-3 py-2">
                      {editable ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="w-24 h-7 text-xs rounded border border-gray-200 bg-white pl-5 pr-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            value={tier.cost}
                            onChange={(e) => updateTier(idx, "cost", parseFloat(e.target.value) || 0)}
                            min={0}
                          />
                        </div>
                      ) : (
                        <span>${tier.cost.toFixed(2)}</span>
                      )}
                    </td>
                    {/* Run charges */}
                    {runChargeCostPerUnit > 0 && (
                      <td className="px-3 py-2">
                        <span className=" text-orange-600">${runChargeCostPerUnit.toFixed(2)}</span>
                      </td>
                    )}
                    {/* Margin */}
                    <td className="px-3 py-2">
                      {editable ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            className="w-20 h-7 text-xs rounded border border-gray-200 bg-white px-2 pr-6 text-right focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            value={+(tier.margin ?? defaultMargin).toFixed(1)}
                            onChange={(e) => updateTier(idx, "margin", parseFloat(e.target.value) || 0)}
                            min={0}
                            max={99}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                        </div>
                      ) : (
                        <span className=" text-gray-600">{(tier.margin ?? defaultMargin).toFixed(1)}%</span>
                      )}
                    </td>
                    {/* Price */}
                    <td className="px-3 py-2">
                      {editable ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            className={`w-24 h-7 text-xs font-semibold rounded border bg-white pl-5 pr-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 ${isBest ? "border-green-300" : "border-gray-200"}`}
                            value={+(tier.price ?? 0).toFixed(2)}
                            onChange={(e) => updateTier(idx, "price", parseFloat(e.target.value) || 0)}
                            min={0}
                          />
                        </div>
                      ) : (
                        <span className={` font-semibold ${isBest ? "text-green-700" : ""}`}>${(tier.price ?? 0).toFixed(2)}</span>
                      )}
                    </td>
                    {/* Actions */}
                    {(editable || onApplyTier) && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onApplyTier && (
                            <Button
                              variant={isBest ? "default" : "outline"}
                              size="sm"
                              className={`h-6 text-[10px] px-2.5 ${isBest ? "bg-green-600 hover:bg-green-700" : ""}`}
                              onClick={() => onApplyTier(tier.cost, tier.price ?? calcPriceFromCost(tier.cost, tier.margin ?? defaultMargin, runChargeCostPerUnit))}
                            >
                              Apply
                            </Button>
                          )}
                          {editable && displayTiers.length > 1 && (
                            <button
                              onClick={() => removeTier(idx)}
                              className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : editable ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          No pricing tiers yet. Click "Add Tier" to set up quantity break pricing.
        </div>
      ) : null}

      {bestMatchIndex >= 0 && (
        <div className="px-4 py-2 border-t bg-green-50/50 text-[10px] text-green-700 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Best match for {totalQuantity} units: Tier {bestMatchIndex + 1} ({displayTiers[bestMatchIndex].quantity}+) at ${displayTiers[bestMatchIndex].cost.toFixed(2)} cost → ${(displayTiers[bestMatchIndex].price ?? 0).toFixed(2)} price
        </div>
      )}
    </div>
  );
}
