import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteLine as deleteLineReq,
  addLine as addLineReq,
  deleteCharge as deleteChargeReq,
  addCharge as addChargeReq,
  updateCharge as updateChargeReq,
  updateProjectItem,
} from "@/services/project-items";
import { updateProduct as updateProductReq } from "@/services/products/requests";
import { projectKeys } from "@/services/projects/keys";
import { useToast } from "@/hooks/use-toast";
import type { OrderItemLine } from "@shared/schema";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import { calcMargin, marginColor } from "../hooks";

interface ProductPricingEditorProps {
  item: any;
  projectId: string;
  onClose: () => void;
}

export default function ProductPricingEditor({ item, projectId, onClose }: ProductPricingEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lines: OrderItemLine[] = item.lines || [];

  const [priceLabel, setPriceLabel] = useState(item.priceLabel || "");
  const [personalComment, setPersonalComment] = useState(item.personalComment || "");
  const [privateNotes, setPrivateNotes] = useState(item.privateNotes || "");
  const [imprintLocation, setImprintLocation] = useState(item.imprintLocation || "");
  const [imprintMethod, setImprintMethod] = useState(item.imprintMethod || "");
  const [decoratorType, setDecoratorType] = useState(item.decoratorType || "supplier");

  // ── Pricing Tiers state ──
  const [tiers, setTiers] = useState(() => {
    if (lines.length > 0) {
      return lines.map((line: OrderItemLine) => ({
        id: line.id,
        quantity: line.quantity || 0,
        cost: Number(line.cost || 0),
        margin: Number(line.margin || 40),
        unitPrice: Number(line.unitPrice || 0),
        showToClient: true,
      }));
    }
    return [{
      id: "new-1",
      quantity: item.quantity || 0,
      cost: Number(item.cost || 0),
      margin: calcMargin(Number(item.cost || 0), Number(item.unitPrice || 0)),
      unitPrice: Number(item.unitPrice || 0),
      showToClient: true,
    }];
  });

  // ── Run Charges state (per-unit costs between Cost and Margin) ──
  const [runCharges, setRunCharges] = useState<Array<{
    id: string; description: string; costPerUnit: number; isNew?: boolean;
  }>>(() => {
    return (item.charges || [])
      .filter((c: any) => c.chargeType === "run")
      .map((c: any) => ({
        id: c.id,
        description: c.description || "",
        costPerUnit: Number(c.amount || 0),
      }));
  });

  // ── Fixed Charges state ──
  const [charges, setCharges] = useState<Array<{
    id: string; description: string; cost: number; margin: number; retail: number; isNew?: boolean;
  }>>(() => {
    return (item.charges || [])
      .filter((c: any) => c.chargeType !== "run")
      .map((c: any) => ({
        id: c.id,
        description: c.description || "",
        cost: Number(c.amount || 0),
        margin: 0,
        retail: Number(c.amount || 0),
      }));
  });

  // ── Colors state ──
  const [colors, setColors] = useState<string[]>(item.colors || []);
  const [newColorInput, setNewColorInput] = useState("");

  // ── Sizes state ──
  const [sizes, setSizes] = useState<string[]>(item.sizes || []);
  const [newSizeInput, setNewSizeInput] = useState("");

  // Total run charge cost per unit
  const totalRunChargeCost = runCharges.reduce((sum, rc) => sum + rc.costPerUnit, 0);

  const updateTier = (index: number, field: string, value: number) => {
    setTiers((prev: any[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "cost" || field === "margin") {
        const baseCost = field === "cost" ? value : updated[index].cost;
        const effectiveCost = baseCost + totalRunChargeCost;
        const margin = field === "margin" ? value : updated[index].margin;
        updated[index].unitPrice = margin > 0 ? effectiveCost / (1 - margin / 100) : effectiveCost;
      } else if (field === "unitPrice") {
        const effectiveCost = updated[index].cost + totalRunChargeCost;
        updated[index].margin = calcMargin(effectiveCost, value);
      }
      return updated;
    });
  };

  const addTier = () => {
    setTiers((prev: any[]) => [...prev, {
      id: `new-${Date.now()}`,
      quantity: 0,
      cost: 0,
      margin: 40,
      unitPrice: 0,
      showToClient: true,
    }]);
  };

  const removeTier = (index: number) => {
    setTiers((prev: any[]) => prev.filter((_: any, i: number) => i !== index));
  };

  // ── Fixed Charge helpers ──
  const addCharge = () => {
    setCharges((prev) => [...prev, {
      id: `new-${Date.now()}`,
      description: "",
      cost: 0,
      margin: 0,
      retail: 0,
      isNew: true,
    }]);
  };

  const updateCharge = (index: number, field: string, value: string | number) => {
    setCharges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "cost" || field === "margin") {
        const cost = field === "cost" ? Number(value) : updated[index].cost;
        const margin = field === "margin" ? Number(value) : updated[index].margin;
        updated[index].retail = margin > 0 ? cost / (1 - margin / 100) : cost;
      } else if (field === "retail") {
        updated[index].margin = updated[index].cost > 0
          ? calcMargin(updated[index].cost, Number(value))
          : 0;
      }
      return updated;
    });
  };

  const removeCharge = (index: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Run Charge helpers ──
  const addRunCharge = () => {
    setRunCharges((prev) => [...prev, {
      id: `new-${Date.now()}`,
      description: "",
      costPerUnit: 0,
      isNew: true,
    }]);
  };

  const updateRunCharge = (index: number, field: string, value: string | number) => {
    setRunCharges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeRunCharge = (index: number) => {
    setRunCharges((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Color helpers ──
  const addColor = () => {
    const trimmed = newColorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors((prev) => [...prev, trimmed]);
      setNewColorInput("");
    }
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Size helpers ──
  const addSize = () => {
    const trimmed = newSizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
      setNewSizeInput("");
    }
  };

  const removeSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save all ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Save pricing tiers (delete old, create new)
      for (const line of lines) {
        await deleteLineReq(item.id, line.id);
      }
      for (const tier of tiers) {
        if (tier.quantity > 0) {
          await addLineReq(item.id, {
            orderItemId: item.id,
            quantity: tier.quantity,
            cost: tier.cost.toFixed(2),
            unitPrice: tier.unitPrice.toFixed(2),
            totalPrice: (tier.quantity * tier.unitPrice).toFixed(2),
            margin: tier.margin.toFixed(2),
          });
        }
      }

      // 2. Save all charges (fixed + run) — delete removed, update existing, create new
      const existingChargeIds = (item.charges || []).map((c: any) => c.id);
      const currentFixedIds = charges.filter((c) => !c.isNew).map((c) => c.id);
      const currentRunIds = runCharges.filter((c) => !c.isNew).map((c) => c.id);
      const allCurrentIds = [...currentFixedIds, ...currentRunIds];
      for (const id of existingChargeIds) {
        if (!allCurrentIds.includes(id)) {
          await deleteChargeReq(item.id, id);
        }
      }
      for (const charge of charges) {
        if (charge.isNew) {
          await addChargeReq(item.id, {
            orderItemId: item.id,
            description: charge.description,
            amount: charge.retail.toFixed(2),
            chargeType: "fixed",
            isVendorCharge: false,
          });
        } else {
          await updateChargeReq(item.id, charge.id, {
            description: charge.description,
            amount: charge.retail.toFixed(2),
          });
        }
      }
      for (const rc of runCharges) {
        if (rc.isNew) {
          await addChargeReq(item.id, {
            orderItemId: item.id,
            description: rc.description,
            amount: rc.costPerUnit.toFixed(2),
            chargeType: "run",
            isVendorCharge: false,
          });
        } else {
          await updateChargeReq(item.id, rc.id, {
            description: rc.description,
            amount: rc.costPerUnit.toFixed(2),
          });
        }
      }

      // 3. Save colors and sizes to product
      if (item.productId) {
        await updateProductReq(item.productId, { colors, sizes });
      }

      // 4. Save order item fields (priceLabel, personalComment, privateNotes, decoration)
      await updateProjectItem(projectId, item.id, {
        priceLabel: priceLabel || null,
        personalComment: personalComment || null,
        privateNotes: privateNotes || null,
        imprintLocation: imprintLocation || null,
        imprintMethod: imprintMethod || null,
        decoratorType: decoratorType || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.itemLines(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemCharges(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
      toast({ title: "Product pricing updated" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="w-12 h-12 object-contain rounded-lg bg-gray-50" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <p>{item.productName}</p>
              <p className="text-sm font-normal text-gray-500">{item.supplierName} {item.productSku ? `· ${item.productSku}` : ""}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-500 mt-1 max-h-20 overflow-y-auto">{item.description}</p>
        )}

        {/* Product Image thumbnails */}
        <div className="flex gap-2 mt-2">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="w-14 h-14 object-contain rounded-lg bg-gray-50 border" />
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded-lg border flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Price Label */}
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">Price Label</label>
          <Input value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="e.g. Budget Option, Premium Tier..." className="h-8 text-sm" />
        </div>

        {/* ── Pricing Table — CommonSKU Horizontal Layout ── */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Pricing</h4>
            <Button size="sm" variant="outline" onClick={addTier} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />Add Tier
            </Button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-[120px]" />
                  {tiers.map((_: any, idx: number) => (
                    <th key={idx} className="text-center px-2 py-2 text-xs font-semibold text-gray-500 min-w-[100px]">
                      <div className="flex items-center justify-between">
                        <span>Tier {idx + 1}</span>
                        {tiers.length > 1 && (
                          <button onClick={() => removeTier(idx)} className="text-red-400 hover:text-red-600 ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Qty row */}
                <tr className="border-b">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Qty</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={tier.quantity || ""}
                        onChange={(e) => updateTier(idx, "quantity", parseInt(e.target.value) || 0)}
                        className="h-7 text-sm text-center"
                      />
                    </td>
                  ))}
                </tr>

                {/* Show to client row */}
                <tr className="border-b bg-gray-50/50">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Show to client?</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={tier.showToClient}
                        onChange={(e) => {
                          setTiers((prev: any[]) => {
                            const updated = [...prev];
                            updated[idx] = { ...updated[idx], showToClient: e.target.checked };
                            return updated;
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                  ))}
                </tr>

                {/* Cost row */}
                <tr className="border-b">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Cost</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.cost || ""}
                        onChange={(e) => updateTier(idx, "cost", parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-center"
                      />
                    </td>
                  ))}
                </tr>

                {/* Run charge rows */}
                {runCharges.map((rc, rcIdx) => (
                  <tr key={rc.id} className="border-b bg-orange-50/40">
                    <td className="px-3 py-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Input
                          value={rc.description}
                          onChange={(e) => updateRunCharge(rcIdx, "description", e.target.value)}
                          placeholder="Charge name"
                          className="h-6 text-xs w-[100px]"
                        />
                        <button onClick={() => removeRunCharge(rcIdx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {tiers.map((_: any, idx: number) => (
                      <td key={idx} className="px-2 py-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={rc.costPerUnit || ""}
                          onChange={(e) => updateRunCharge(rcIdx, "costPerUnit", parseFloat(e.target.value) || 0)}
                          className="h-6 text-xs text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* + add run charge link */}
                <tr className="border-b bg-gray-50/30">
                  <td colSpan={tiers.length + 1} className="px-3 py-1">
                    <button onClick={addRunCharge} className="text-xs text-teal-600 hover:text-teal-800 hover:underline">+ add run charge</button>
                  </td>
                </tr>

                {/* Margin row */}
                <tr className="border-b">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Margin</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.margin.toFixed(2)}
                          onChange={(e) => updateTier(idx, "margin", parseFloat(e.target.value) || 0)}
                          className={`h-7 text-sm text-center pr-6 ${marginColor(tier.margin)}`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Total row (was Client Price) */}
                <tr className="bg-gray-50">
                  <td className="px-3 py-1.5 text-xs font-bold text-gray-700">Total</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.unitPrice.toFixed(2)}
                        onChange={(e) => updateTier(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-center font-semibold"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Fixed Charges ── */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Fixed Charges</h4>
            <Button size="sm" variant="outline" onClick={addCharge} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />Add Fixed Charge
            </Button>
          </div>

          {charges.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_80px_90px_36px] gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500">
                <span>Label</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Margin %</span>
                <span className="text-right">Retail</span>
                <span />
              </div>
              {charges.map((charge, idx) => (
                <div key={charge.id} className="grid grid-cols-[1fr_90px_80px_90px_36px] gap-2 px-3 py-1.5 border-b last:border-b-0 items-center">
                  <Input
                    value={charge.description}
                    onChange={(e) => updateCharge(idx, "description", e.target.value)}
                    placeholder="Charge name"
                    className="h-7 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.cost || ""}
                    onChange={(e) => updateCharge(idx, "cost", parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm text-right"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.margin.toFixed(1)}
                    onChange={(e) => updateCharge(idx, "margin", parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm text-right"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.retail.toFixed(2)}
                    onChange={(e) => updateCharge(idx, "retail", parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm text-right font-medium"
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeCharge(idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-2">No fixed charges</p>
              <button onClick={addCharge} className="text-xs text-teal-600 hover:text-teal-800 hover:underline">+ add fixed charge</button>
            </div>
          )}
        </div>

        {/* ── Product Colors ── */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold mb-2">Product Colors</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {colors.length > 0 ? colors.map((color: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs gap-1 pr-1">
                <span className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0" style={{ backgroundColor: color.toLowerCase() }} />
                {color}
                <button onClick={() => removeColor(idx)} className="ml-0.5 text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )) : (
              <p className="text-sm text-gray-400">No colors assigned</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newColorInput}
              onChange={(e) => setNewColorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
              placeholder="Add a new color (e.g. Navy Blue)"
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addColor} className="h-8 text-xs" disabled={!newColorInput.trim()}>
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </div>
        </div>

        {/* ── Product Sizes ── */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold mb-2">Product Sizes</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sizes.length > 0 ? sizes.map((size: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs gap-1 pr-1">
                {size}
                <button onClick={() => removeSize(idx)} className="ml-0.5 text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )) : (
              <p className="text-sm text-gray-400">No sizes assigned</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSizeInput}
              onChange={(e) => setNewSizeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
              placeholder="Add a size (e.g. S, M, L, XL)"
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addSize} className="h-8 text-xs" disabled={!newSizeInput.trim()}>
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </div>
        </div>

        {/* ── Decoration Info ── */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold mb-3">Decoration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Imprint Location</label>
              <Select value={imprintLocation} onValueChange={setImprintLocation}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {IMPRINT_LOCATIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Imprint Method</label>
              <Select value={imprintMethod} onValueChange={setImprintMethod}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {IMPRINT_METHODS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Decorator</label>
              <Select value={decoratorType} onValueChange={setDecoratorType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-green-600" />
                      Supplier Decorator
                    </span>
                  </SelectItem>
                  <SelectItem value="third_party">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-orange-600" />
                      3rd Party Decorator
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-400 mt-1">
                {decoratorType === "supplier"
                  ? "Supplier provides both blank goods and decoration"
                  : "Blank goods ship to separate decorator for imprinting"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Personal Comment ── */}
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500 block mb-1">Personal Comment</label>
          <Textarea
            value={personalComment}
            onChange={(e) => setPersonalComment(e.target.value)}
            placeholder="Add a personal comment for the client..."
            className="min-h-[60px] resize-none text-sm"
          />
        </div>

        {/* ── Private Notes ── */}
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">Private Notes (internal only)</label>
          <Textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            placeholder="Internal notes — not visible to the client..."
            className="min-h-[60px] resize-none text-sm bg-yellow-50"
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
