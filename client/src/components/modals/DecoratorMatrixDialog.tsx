import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "@/lib/wouter-compat";
import { useMatricesBySupplier, useMatrix } from "@/services/decorator-matrix/queries";
import { Grid3X3, Loader2, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface DecoratorMatrixDialogProps {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  readOnly?: boolean;
}

/**
 * Read-only dialog showing all decorator matrices for a vendor.
 * Used from EditProductPage to view pricing grids without editing.
 */
export default function DecoratorMatrixDialog({
  open, supplierId, supplierName, onClose,
}: DecoratorMatrixDialogProps) {
  const [, navigate] = useLocation();

  const { data: matrices = [], isLoading } = useMatricesBySupplier(open ? supplierId : undefined);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);

  const { data: matrixDetail } = useMatrix(selectedMatrixId || undefined);

  useEffect(() => {
    if (matrices.length > 0 && !selectedMatrixId) {
      setSelectedMatrixId(matrices[0].id);
    }
  }, [matrices, selectedMatrixId]);

  useEffect(() => {
    if (!open) setSelectedMatrixId(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Decorator Matrix — {supplierName}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs text-muted-foreground"
              onClick={() => { onClose(); navigate("/settings?tab=decorator-matrix"); }}
            >
              <Settings className="w-3 h-3 mr-1" />
              Manage in Settings
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Matrix selector */}
          <div>
            {matrices.length > 0 ? (
              <Select value={selectedMatrixId || ""} onValueChange={setSelectedMatrixId}>
                <SelectTrigger><SelectValue placeholder="Select decoration..." /></SelectTrigger>
                <SelectContent>
                  {matrices.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.isDefault && " (default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No decorations configured</p>
            )}
          </div>

          {/* Matrix detail */}
          {matrixDetail && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold">{matrixDetail.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {matrixDetail.chargeType === "run" ? "Run" : "Fixed"} · {matrixDetail.displayType === "table" ? "Table" : matrixDetail.displayType === "per_item" ? "Per Item" : "List"}
                </Badge>
              </div>

              {/* Table type */}
              {matrixDetail.displayType === "table" && matrixDetail.breakdowns?.length > 0 && (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {matrixDetail.rowBasis || "Row"}
                        </th>
                        {matrixDetail.breakdowns.map((b: any) => (
                          <th key={b.id} className="px-3 py-2 text-center font-medium text-muted-foreground">
                            {b.minQuantity}-{b.maxQuantity ?? "+"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(matrixDetail.rows || []).map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{r.rowLabel}</td>
                          {matrixDetail.breakdowns.map((b: any) => {
                            const cell = (matrixDetail.cells || []).find(
                              (c: any) => c.rowId === r.id && c.breakdownId === b.id
                            );
                            return (
                              <td key={b.id} className="px-3 py-2 text-center">
                                ${parseFloat(cell?.price || "0").toFixed(4)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Per item / list type */}
              {(matrixDetail.displayType === "per_item" || matrixDetail.displayType === "list") && (
                <div className="border rounded-lg overflow-hidden">
                  {(matrixDetail.rows || []).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-sm">
                      <span className="flex-1">{r.rowLabel}</span>
                      <span className="font-medium">${parseFloat(r.unitCost || "0").toFixed(2)}</span>
                      {r.perUnit && <span className="text-xs text-muted-foreground">{r.perUnit}</span>}
                    </div>
                  ))}
                </div>
              )}

              {(!matrixDetail.rows || matrixDetail.rows.length === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No pricing data yet. Configure in Settings.
                </p>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
