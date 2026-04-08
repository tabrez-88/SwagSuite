import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUpdateArtworkCharge } from "@/services/project-items";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Loader2, Settings, Check } from "lucide-react";
import { useLocation } from "wouter";

interface MatrixChargePickerProps {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  chargeType: "run" | "fixed";
  artworkId: string;
  chargeId: string;
  chargeName: string;
  currentMargin?: number;
  quantity: number;
  projectId: string | number;
  artworkMethod?: string;
}

/** Maps chargeType to compatible matrixType values.
 * Run charges only show run-type tables. Fixed charges only show fixed-type tables.
 * Keep them strictly separated to avoid confusion. */
const MATRIX_TYPE_MAP: Record<string, string[]> = {
  run: ["run_charge_table", "run_charge_per_item"],
  fixed: ["fixed_charge_table", "fixed_charge_list"],
};

export default function MatrixChargePicker({
  open, onClose, supplierId, supplierName,
  chargeType, artworkId, chargeId, chargeName,
  currentMargin = 0, quantity, projectId, artworkMethod,
}: MatrixChargePickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const updateChargeMutation = useUpdateArtworkCharge(projectId);

  // Fetch all matrices for supplier
  const { data: allMatrices = [], isLoading: matricesLoading } = useQuery<any[]>({
    queryKey: [`/api/suppliers/${supplierId}/matrices`],
    enabled: open && !!supplierId,
  });

  // Filter matrices by charge type + optionally by artwork method
  const filteredMatrices = useMemo(() => {
    const compatibleTypes = MATRIX_TYPE_MAP[chargeType] || [];
    let filtered = allMatrices.filter((m: any) => compatibleTypes.includes(m.matrixType));
    // If artworkMethod is set, prefer matrices matching that method
    if (artworkMethod) {
      const methodMatch = filtered.filter((m: any) => m.decorationMethod === artworkMethod);
      if (methodMatch.length > 0) filtered = methodMatch;
    }
    return filtered;
  }, [allMatrices, chargeType, artworkMethod]);

  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Auto-select default or first matrix
  useEffect(() => {
    if (filteredMatrices.length > 0 && !selectedMatrixId) {
      const defaultMatrix = filteredMatrices.find((m: any) => m.isDefault) || filteredMatrices[0];
      setSelectedMatrixId(defaultMatrix.id);
    }
  }, [filteredMatrices, selectedMatrixId]);

  // Reset selection when matrix changes
  useEffect(() => {
    setSelectedEntryId(null);
  }, [selectedMatrixId]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMatrixId(null);
      setSelectedEntryId(null);
    }
  }, [open]);

  // Fetch matrix detail with entries
  const { data: matrixDetail, isLoading: detailLoading } = useQuery<any>({
    queryKey: [`/api/matrices/${selectedMatrixId}`],
    enabled: !!selectedMatrixId,
  });

  const entries: any[] = matrixDetail?.entries || [];
  const matrixType: string = matrixDetail?.matrixType || "";

  // Auto-highlight row matching quantity for table types
  useEffect(() => {
    if (!entries.length) return;
    if (matrixType === "run_charge_table" || matrixType === "fixed_charge_table") {
      const match = entries.find((e: any) => {
        const min = e.minQuantity || 0;
        const max = e.maxQuantity;
        return quantity >= min && (max === null || max === undefined || quantity <= max);
      });
      if (match) setSelectedEntryId(match.id);
    }
  }, [entries, matrixType, quantity]);

  /** Get the cost value from a selected entry based on matrix type */
  const getEntryCost = (entry: any): number => {
    if (matrixType === "run_charge_table") {
      return parseFloat(entry.runCost || "0");
    }
    return parseFloat(entry.unitCost || "0");
  };

  /** Get the label for a selected entry */
  const getEntryLabel = (entry: any): string => {
    if (matrixType === "run_charge_table") return "Imprint Cost";
    return entry.rowLabel || chargeName;
  };

  const selectedEntry = entries.find((e: any) => e.id === selectedEntryId);

  const handleApply = () => {
    if (!selectedEntry) return;
    const netCost = getEntryCost(selectedEntry);
    const margin = currentMargin;
    const retailPrice = margin > 0 && margin < 100 ? netCost / (1 - margin / 100) : netCost;
    const newChargeName = getEntryLabel(selectedEntry);

    updateChargeMutation.mutate({
      artworkId,
      chargeId,
      updates: {
        netCost: netCost.toFixed(2),
        retailPrice: retailPrice.toFixed(2),
        chargeName: newChargeName,
      },
    }, {
      onSuccess: async () => {
        // Force refetch of parent queries before closing modal.
        // Awaiting refetchQueries guarantees the new charge data is in cache
        // before the user sees the updated UI.
        await queryClient.refetchQueries({
          queryKey: [`/api/projects/${projectId}/items-with-details`],
        });
        toast({
          title: "Charge updated",
          description: `Applied $${netCost.toFixed(2)} from "${matrixDetail?.name}"`,
        });
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="w-4 h-4" />
            Select {chargeType === "run" ? "Run" : "Fixed"} Charge — {supplierName}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs text-muted-foreground"
              onClick={() => { onClose(); navigate("/settings?tab=decorator-matrix"); }}
            >
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </Button>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Pick pricing from decorator matrix to apply to <strong>"{chargeName}"</strong>
            {quantity > 0 && <> · Qty: <strong>{quantity}</strong></>}
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto">
          {/* Matrix selector */}
          <div>
            {matricesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading matrices...
              </div>
            ) : filteredMatrices.length > 0 ? (
              <Select value={selectedMatrixId || ""} onValueChange={(v) => setSelectedMatrixId(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select matrix..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredMatrices.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} — {m.decorationMethod}
                      {m.isDefault ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No {chargeType} charge matrices found for this decorator.
                <br />
                <Button variant="link" size="sm" className="text-xs"
                  onClick={() => { onClose(); navigate("/settings?tab=decorator-matrix"); }}>
                  Set up matrices in Settings
                </Button>
              </div>
            )}
          </div>

          {/* Pricing table */}
          {detailLoading && selectedMatrixId && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading entries...
            </div>
          )}

          {matrixDetail && entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No entries in this matrix. Add pricing in Settings.
            </p>
          )}

          {matrixDetail && entries.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              {/* run_charge_table — only shown for run charges now */}
              {matrixType === "run_charge_table" && (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Min Qty</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Max Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Colors</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Run Cost</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Add'l Color</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: any) => {
                      const isSelected = selectedEntryId === entry.id;
                      const costValue = getEntryCost(entry);
                      const isQtyMatch = (() => {
                        const min = entry.minQuantity || 0;
                        const max = entry.maxQuantity;
                        return quantity >= min && (max === null || max === undefined || quantity <= max);
                      })();
                      return (
                        <tr
                          key={entry.id}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-200" :
                            isQtyMatch ? "bg-yellow-50/50" :
                            "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedEntryId(entry.id)}
                        >
                          <td className="px-3 py-2">{entry.minQuantity || 0}</td>
                          <td className="px-3 py-2">{entry.maxQuantity ?? "∞"}</td>
                          <td className="px-3 py-2 text-right">{entry.colorCount || 1}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${costValue.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-400">
                            ${parseFloat(entry.additionalColorCost || "0").toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* fixed_charge_table */}
              {matrixType === "fixed_charge_table" && (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Charge</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Min Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Max Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Cost</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: any) => {
                      const isSelected = selectedEntryId === entry.id;
                      const isQtyMatch = (() => {
                        const min = entry.minQuantity || 0;
                        const max = entry.maxQuantity;
                        return quantity >= min && (max === null || max === undefined || quantity <= max);
                      })();
                      return (
                        <tr
                          key={entry.id}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-200" :
                            isQtyMatch ? "bg-yellow-50/50" :
                            "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedEntryId(entry.id)}
                        >
                          <td className="px-3 py-2 font-medium">{entry.rowLabel || "—"}</td>
                          <td className="px-3 py-2 text-right">{entry.minQuantity || 0}</td>
                          <td className="px-3 py-2 text-right">{entry.maxQuantity ?? "∞"}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${parseFloat(entry.unitCost || "0").toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* run_charge_per_item / fixed_charge_list */}
              {(matrixType === "run_charge_per_item" || matrixType === "fixed_charge_list") && (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Charge</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Cost</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: any) => {
                      const isSelected = selectedEntryId === entry.id;
                      return (
                        <tr
                          key={entry.id}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedEntryId(entry.id)}
                        >
                          <td className="px-3 py-2 font-medium">{entry.rowLabel || "—"}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${parseFloat(entry.unitCost || "0").toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Selected entry preview */}
          {selectedEntry && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected cost:</span>
                <span className="font-bold">${getEntryCost(selectedEntry).toFixed(2)}</span>
              </div>
              {currentMargin > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">With {currentMargin}% margin:</span>
                  <span className="font-semibold">
                    ${(getEntryCost(selectedEntry) / (1 - currentMargin / 100)).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Charge name:</span>
                <span className="font-medium">{getEntryLabel(selectedEntry)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            disabled={!selectedEntry || updateChargeMutation.isPending}
          >
            {updateChargeMutation.isPending ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Applying...</>
            ) : (
              <>Apply to Charge</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
