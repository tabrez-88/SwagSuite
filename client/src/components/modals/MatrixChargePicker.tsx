import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import { useUpdateArtworkCharge } from "@/services/project-items";
import { useMatrixLookup } from "@/services/decorator-matrix/queries";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Grid3X3, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  numberOfColors?: number;
  quantity: number;
  projectId: string | number;
  /** When provided, skips server mutation and calls this instead (for local/unsaved state) */
  onApply?: (artworkId: string, chargeId: string, updates: { netCost: string; retailPrice: string; margin: string; chargeName: string }) => void;
}

export default function MatrixChargePicker({
  open,
  onClose,
  supplierId,
  supplierName,
  chargeType,
  artworkId,
  chargeId,
  chargeName,
  currentMargin = 0,
  numberOfColors = 1,
  quantity,
  projectId,
  onApply,
}: MatrixChargePickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateChargeMutation = useUpdateArtworkCharge(projectId);
  const marginSettings = useMarginSettings();

  const effectiveMargin =
    currentMargin > 0 ? currentMargin : marginSettings.defaultMargin;

  // Fetch all matrices for supplier (optionally filtered by artwork method)
  const { data: lookupData, isLoading: matricesLoading } = useMatrixLookup(
    open ? supplierId : undefined,
  );

  // Filter matrices by chargeType (run/fixed) to match the charge being edited
  const allMatrices: any[] = (lookupData?.matrices || []).filter(
    (m: any) => m.chargeType === chargeType,
  );

  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  // Initialize colorCount from artwork's numberOfColors
  const [colorCount, setColorCount] = useState(numberOfColors);
  const [colorCountText, setColorCountText] = useState(String(numberOfColors));

  // Auto-select default or first matrix
  useEffect(() => {
    if (allMatrices.length > 0 && !selectedMatrixId) {
      const defaultMatrix =
        allMatrices.find((m: any) => m.isDefault) || allMatrices[0];
      setSelectedMatrixId(defaultMatrix.id);
    }
  }, [allMatrices, selectedMatrixId]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMatrixId(null);
      setColorCount(numberOfColors);
    } else {
      // When opening, set colorCount from artwork
      setColorCount(numberOfColors);
      setColorCountText(String(numberOfColors));
    }
  }, [open, numberOfColors]);

  const selectedMatrix = allMatrices.find(
    (m: any) => m.id === selectedMatrixId,
  );
  const displayType = selectedMatrix?.displayType || "table";

  // ── Determine highlighted row + column + resulting price ──

  const {
    highlightedRowId,
    highlightedBreakdownId,
    resolvedPrice,
    resolvedLabel,
  } = useMemo(() => {
    if (!selectedMatrix)
      return {
        highlightedRowId: null,
        highlightedBreakdownId: null,
        resolvedPrice: null,
        resolvedLabel: chargeName,
      };

    const { breakdowns = [], rows = [], cells = [] } = selectedMatrix;

    if (displayType === "table") {
      // Find column matching quantity — try bounded breakdowns first,
      // then fall back to unbounded (maxQuantity=null) catch-all
      const matchedBreakdown =
        breakdowns.find((b: any) =>
          b.maxQuantity != null && quantity >= b.minQuantity && quantity <= b.maxQuantity
        ) ??
        breakdowns.find((b: any) =>
          b.maxQuantity == null && quantity >= b.minQuantity
        );

      // Find row matching colorCount (compare as string since rowLabel is string)
      const matchedRow = rows.find(
        (r: any) => r.rowLabel === String(colorCount),
      );

      if (matchedBreakdown && matchedRow) {
        const cell = cells.find(
          (c: any) =>
            c.rowId === matchedRow.id && c.breakdownId === matchedBreakdown.id,
        );
        return {
          highlightedRowId: matchedRow.id,
          highlightedBreakdownId: matchedBreakdown.id,
          resolvedPrice: cell ? parseFloat(cell.price) : null,
          resolvedLabel: selectedMatrix.name,
        };
      }
      // Partial match — highlight what we can
      return {
        highlightedRowId: matchedRow?.id || null,
        highlightedBreakdownId: matchedBreakdown?.id || null,
        resolvedPrice: null,
        resolvedLabel: selectedMatrix.name,
      };
    }

    // per_item / list: no auto-resolution, user picks a row
    return {
      highlightedRowId: null,
      highlightedBreakdownId: null,
      resolvedPrice: null,
      resolvedLabel: chargeName,
    };
  }, [selectedMatrix, displayType, quantity, colorCount, chargeName]);

  // For per_item/list, user selects a row manually
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedRowId(null);
  }, [selectedMatrixId]);

  const selectedRow = selectedMatrix?.rows?.find(
    (r: any) => r.id === selectedRowId,
  );
  const finalPrice =
    displayType === "table"
      ? resolvedPrice
      : selectedRow
        ? parseFloat(selectedRow.unitCost || "0")
        : null;
  const finalLabel =
    displayType === "table"
      ? resolvedLabel
      : selectedRow?.rowLabel || chargeName;

  const handleApply = () => {
    if (finalPrice === null || finalPrice === undefined) return;
    const margin = effectiveMargin;
    const retailPrice =
      margin > 0 && margin < 100 ? finalPrice / (1 - margin / 100) : finalPrice;

    const updates = {
      netCost: finalPrice.toFixed(2),
      retailPrice: retailPrice.toFixed(2),
      margin: margin.toFixed(2),
      chargeName: finalLabel,
    };

    // Local mode: skip server mutation, call callback directly
    if (onApply) {
      onApply(artworkId, chargeId, updates);
      toast({
        title: "Charge updated",
        description: `Applied $${finalPrice.toFixed(2)} from "${selectedMatrix?.name}"`,
      });
      onClose();
      return;
    }

    updateChargeMutation.mutate(
      { artworkId, chargeId, updates },
      {
        onSuccess: async () => {
          await queryClient.refetchQueries({
            queryKey: [`/api/projects/${projectId}/items-with-details`],
          });
          toast({
            title: "Charge updated",
            description: `Applied $${finalPrice.toFixed(2)} from "${selectedMatrix?.name}"`,
          });
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="w-4 h-4" />
            Add Charge - {supplierName}
            {quantity > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({chargeType === "run" ? "Run Charge" : "Fixed Charge"} · Qty:{" "}
                {quantity})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-2 min-h-0 space-y-3 overflow-y-auto">
          <div className="flex flex-1 items-end gap-4">
            {/* Step 1: Decoration selector */}
            {matricesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading...
              </div>
            ) : allMatrices.length > 0 ? (
              <div className="flex flex-col gap-2 w-full">
                <Label className="text-xs text-muted-foreground">
                  Decoration
                </Label>
                <Select
                  value={selectedMatrixId || ""}
                  onValueChange={setSelectedMatrixId}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select decoration..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allMatrices.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                        {m.isDefault ? " (default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No decorations found for this vendor.
              </div>
            )}

            {/* Step 2: # of Colors input (only for table type) */}
            {selectedMatrix && displayType === "table" && (
              <div className="flex flex-col items-start gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  # of {selectedMatrix.rowBasis || "Colors"}
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="w-20 text-sm"
                  value={colorCountText}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v)) {
                      setColorCountText(v);
                      const n = parseInt(v);
                      if (n > 0) setColorCount(n);
                    }
                  }}
                  onBlur={() => {
                    const n = parseInt(colorCountText);
                    if (!n || n < 1) {
                      setColorCount(1);
                      setColorCountText("1");
                    } else {
                      setColorCount(n);
                      setColorCountText(String(n));
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Step 3: Grid display (table type) */}
          {selectedMatrix &&
            displayType === "table" &&
            selectedMatrix.breakdowns.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        {selectedMatrix.rowBasis || "Colors"}
                      </th>
                      {selectedMatrix.breakdowns.map((b: any) => (
                        <th
                          key={b.id}
                          className={`px-3 py-2 text-center font-medium ${
                            b.id === highlightedBreakdownId
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {b.minQuantity}-{b.maxQuantity ?? "+"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                    <tbody>
                    {selectedMatrix.rows
                      .filter((r: any) => r.id === highlightedRowId)
                      .map((r: any) => {
                      const isHighlightedRow = r.id === highlightedRowId;
                      return (
                        <tr
                        key={r.id}
                        className={`border-b last:border-0 ${isHighlightedRow ? "" : ""}`}
                        >
                        <td
                          className={`px-3 py-2 font-medium ${isHighlightedRow ? "text-primary" : ""}`}
                        >
                          {r.rowLabel}
                        </td>
                        {selectedMatrix.breakdowns.map((b: any) => {
                          const cell = selectedMatrix.cells.find(
                          (c: any) =>
                            c.rowId === r.id && c.breakdownId === b.id,
                          );
                          const isHighlightedCell =
                          r.id === highlightedRowId &&
                          b.id === highlightedBreakdownId;
                          return (
                          <td
                            key={b.id}
                            className={`px-3 py-2 text-center ${
                            isHighlightedCell
                              ? "bg-primary text-primary-foreground font-bold"
                              : ""
                            }`}
                          >
                            ${parseFloat(cell?.price || "0").toFixed(4)}
                          </td>
                          );
                        })}
                        </tr>
                      );
                      })}
                    </tbody>
                </table>
              </div>
            )}

          {/* Per Item / List display — user clicks to select */}
          {selectedMatrix &&
            (displayType === "per_item" || displayType === "list") && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Charge
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        Cost
                      </th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMatrix.rows.map((r: any) => {
                      const isSelected = selectedRowId === r.id;
                      return (
                        <tr
                          key={r.id}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                              : "hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedRowId(r.id)}
                        >
                          <td className="px-3 py-2 font-medium">
                            {r.rowLabel}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${parseFloat(r.unitCost || "0").toFixed(2)}
                            {r.perUnit && (
                              <span className="text-muted-foreground ml-1">
                                {r.perUnit}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          {/* No data state */}
          {selectedMatrix &&
            (!selectedMatrix.rows || selectedMatrix.rows.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pricing data. Configure in Settings.
              </p>
            )}

          {/* Result preview */}
          {finalPrice !== null && finalPrice !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  This charge will be applied:
                </span>
                <span className="font-bold text-base">
                  ${finalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Sell with {effectiveMargin.toFixed(1)}% margin
                  {currentMargin === 0 && (
                    <span className="text-gray-400"> (default)</span>
                  )}
                  :
                </span>
                <span className="font-semibold text-green-700">
                  ${(finalPrice / (1 - effectiveMargin / 100)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Charge name:</span>
                <span className="font-medium">{finalLabel}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              finalPrice === null ||
              finalPrice === undefined ||
              updateChargeMutation.isPending
            }
          >
            {updateChargeMutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Applying...
              </>
            ) : (
              <>Add</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
