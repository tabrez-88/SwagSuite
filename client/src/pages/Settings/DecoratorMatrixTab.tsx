import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { patchSupplier } from "@/services/suppliers/requests";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Grid3X3,
  List,
  Loader2,
  Minus,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateSupplierMatrix,
  useUpdateMatrix,
  useDeleteMatrix,
  useCopyMatrix,
} from "@/services/decorator-matrix/mutations";
import {
  addBreakdown,
  removeBreakdown,
  updateBreakdown,
  addRow,
  removeRow,
  updateRow,
  saveGrid,
} from "@/services/decorator-matrix/requests";
import { matrixKeys } from "@/services/decorator-matrix/keys";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ───

interface MatrixData {
  id: string;
  supplierId: string;
  name: string;
  chargeType: string;
  displayType: string;
  description: string | null;
  rowBasis: string | null;
  increment: string | null;
  units: string | null;
  isDefault: boolean | null;
  notes: string | null;
  breakdowns: Breakdown[];
  rows: MatrixRow[];
  cells: MatrixCell[];
}

interface Breakdown {
  id: string;
  matrixId: string;
  minQuantity: number;
  maxQuantity: number | null;
  sortOrder: number;
}

interface MatrixRow {
  id: string;
  matrixId: string;
  rowLabel: string;
  unitCost: string | null;
  perUnit: string | null;
  sortOrder: number;
}

interface MatrixCell {
  id: string;
  matrixId: string;
  rowId: string;
  breakdownId: string;
  price: string;
}

// ─── Run Charge Table Editor (2D Grid) ───

function RunChargeTableEditor({
  matrix,
  supplierId,
  onRefresh,
}: {
  matrix: MatrixData;
  supplierId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { breakdowns, rows, cells } = matrix;
  const [editingCells, setEditingCells] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Build cell lookup: cellKey = `${rowId}_${breakdownId}` → price
  const cellMap = useMemo(() => {
    const map: Record<string, string> = {};
    cells.forEach((c) => {
      map[`${c.rowId}_${c.breakdownId}`] = c.price;
    });
    return map;
  }, [cells]);

  // Initialize editing cells from actual data
  useEffect(() => {
    const initial: Record<string, string> = {};
    rows.forEach((r) => {
      breakdowns.forEach((b) => {
        const key = `${r.id}_${b.id}`;
        initial[key] = cellMap[key] || "0";
      });
    });
    setEditingCells(initial);
  }, [rows, breakdowns, cellMap]);

  const handleSaveGrid = async () => {
    setSaving(true);
    try {
      const cellData = Object.entries(editingCells).map(([key, price]) => {
        const [rowId, breakdownId] = key.split("_");
        return { rowId, breakdownId, price };
      });
      await saveGrid(matrix.id, cellData);
      toast({ title: "Grid saved" });
      onRefresh();
    } catch {
      toast({ title: "Failed to save grid", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleAddRow = async () => {
    try {
      const nextLabel = `${rows.length + 1}`;
      await addRow(matrix.id, { rowLabel: nextLabel });
      onRefresh();
    } catch {
      toast({ title: "Failed to add row", variant: "destructive" });
    }
  };

  const handleRemoveRow = async (rowId: string) => {
    try {
      await removeRow(matrix.id, rowId);
      onRefresh();
    } catch {
      toast({ title: "Failed to remove row", variant: "destructive" });
    }
  };

  const handleAddBreakdown = async () => {
    try {
      const lastBd = breakdowns[breakdowns.length - 1];
      const nextMin = lastBd
        ? (lastBd.maxQuantity ?? lastBd.minQuantity) + 1
        : 1;
      await addBreakdown(matrix.id, {
        minQuantity: nextMin,
        maxQuantity: null,
      });
      onRefresh();
    } catch {
      toast({ title: "Failed to add column", variant: "destructive" });
    }
  };

  const handleRemoveBreakdown = async (breakdownId: string) => {
    try {
      await removeBreakdown(matrix.id, breakdownId);
      onRefresh();
    } catch {
      toast({ title: "Failed to remove column", variant: "destructive" });
    }
  };

  const handleUpdateBreakdown = async (
    breakdownId: string,
    data: Record<string, unknown>,
  ) => {
    try {
      await updateBreakdown(matrix.id, breakdownId, data);
      onRefresh();
    } catch {
      toast({ title: "Failed to update column", variant: "destructive" });
    }
  };

  const handleUpdateRowLabel = async (rowId: string, label: string) => {
    try {
      await updateRow(matrix.id, rowId, { rowLabel: label });
      onRefresh();
    } catch {
      toast({ title: "Failed to update row", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Rows:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() =>
              rows.length > 1 && handleRemoveRow(rows[rows.length - 1].id)
            }
            disabled={rows.length <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-6 text-center font-medium">{rows.length}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleAddRow}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Columns:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() =>
              breakdowns.length > 1 &&
              handleRemoveBreakdown(breakdowns[breakdowns.length - 1].id)
            }
            disabled={breakdowns.length <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-6 text-center font-medium">
            {breakdowns.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleAddBreakdown}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <Button
          size="sm"
          className="h-7 ml-auto"
          onClick={handleSaveGrid}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Save Grid
        </Button>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground w-20">
                {matrix.rowBasis || "Row"}
              </th>
              {breakdowns.map((b) => (
                <th
                  key={b.id}
                  className="text-center px-1 py-1 font-medium min-w-[80px]"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-0.5 justify-center">
                      <input
                        type="number"
                        className="w-12 text-center text-xs bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded outline-none px-0.5"
                        defaultValue={b.minQuantity}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val !== b.minQuantity)
                            handleUpdateBreakdown(b.id, { minQuantity: val });
                        }}
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="number"
                        className="w-12 text-center text-xs bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded outline-none px-0.5"
                        defaultValue={b.maxQuantity ?? ""}
                        placeholder="+"
                        onBlur={(e) => {
                          const val = e.target.value
                            ? parseInt(e.target.value)
                            : null;
                          if (val !== b.maxQuantity)
                            handleUpdateBreakdown(b.id, { maxQuantity: val });
                        }}
                      />
                    </div>
                  </div>
                </th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className="px-2 py-1.5">
                  <input
                    className="w-full text-xs font-medium bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded outline-none px-1 py-0.5"
                    defaultValue={r.rowLabel}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== r.rowLabel) handleUpdateRowLabel(r.id, val);
                    }}
                  />
                </td>
                {breakdowns.map((b) => {
                  const key = `${r.id}_${b.id}`;
                  return (
                    <td key={b.id} className="px-1 py-1">
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full text-xs text-right bg-transparent border border-gray-200 hover:border-gray-300 focus:border-blue-400 rounded outline-none px-1.5 py-1"
                        value={editingCells[key] ?? "0"}
                        onChange={(e) =>
                          setEditingCells((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </td>
                  );
                })}
                <td className="px-1 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                    onClick={() => handleRemoveRow(r.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row link */}
      <button
        className="text-xs text-primary hover:underline"
        onClick={handleAddRow}
      >
        + Greater than {rows.length}
      </button>
    </div>
  );
}

// ─── Per Item Editor ───

function PerItemEditor({
  matrix,
  onRefresh,
}: {
  matrix: MatrixData;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { rows } = matrix;

  const handleAddCharge = async () => {
    try {
      await addRow(matrix.id, { rowLabel: "New charge", unitCost: "0.0000" });
      onRefresh();
    } catch {
      toast({ title: "Failed to add charge", variant: "destructive" });
    }
  };

  const handleRemoveCharge = async (rowId: string) => {
    try {
      await removeRow(matrix.id, rowId);
      onRefresh();
    } catch {
      toast({ title: "Failed to remove charge", variant: "destructive" });
    }
  };

  const handleUpdateCharge = async (
    rowId: string,
    data: Record<string, unknown>,
  ) => {
    try {
      await updateRow(matrix.id, rowId, data);
      onRefresh();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 border rounded-md px-3 py-2"
        >
          <input
            className="flex-1 text-sm bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
            defaultValue={r.rowLabel}
            placeholder="Charge description"
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val !== r.rowLabel)
                handleUpdateCharge(r.id, { rowLabel: val });
            }}
          />
          <span className="text-xs text-muted-foreground">$</span>
          <input
            type="number"
            step="0.0001"
            className="w-24 text-sm text-right bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
            defaultValue={parseFloat(r.unitCost || "0").toFixed(4)}
            onBlur={(e) => {
              const val = e.target.value;
              if (val !== r.unitCost)
                handleUpdateCharge(r.id, { unitCost: val });
            }}
          />
          <span className="text-xs text-muted-foreground">Per Item</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
            onClick={() => handleRemoveCharge(r.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <button
        className="text-xs text-primary hover:underline"
        onClick={handleAddCharge}
      >
        + Add Charge
      </button>
    </div>
  );
}

// ─── Fixed Charge Table Editor ───

function FixedChargeTableEditor({
  matrix,
  onRefresh,
}: {
  matrix: MatrixData;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { rows } = matrix;

  const handleAddRow = async () => {
    try {
      await addRow(matrix.id, { rowLabel: "New charge", unitCost: "0.0000" });
      onRefresh();
    } catch {
      toast({ title: "Failed to add row", variant: "destructive" });
    }
  };

  const handleRemoveRow = async (rowId: string) => {
    try {
      await removeRow(matrix.id, rowId);
      onRefresh();
    } catch {
      toast({ title: "Failed to remove row", variant: "destructive" });
    }
  };

  const handleUpdateRow = async (
    rowId: string,
    data: Record<string, unknown>,
  ) => {
    try {
      await updateRow(matrix.id, rowId, data);
      onRefresh();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">
                Label
              </th>
              <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground w-28">
                Cost
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-2 py-1.5">
                  <input
                    className="w-full text-sm bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
                    defaultValue={r.rowLabel}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== r.rowLabel)
                        handleUpdateRow(r.id, { rowLabel: val });
                    }}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-20 text-sm text-right bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
                      defaultValue={parseFloat(r.unitCost || "0").toFixed(4)}
                      onBlur={(e) => {
                        handleUpdateRow(r.id, { unitCost: e.target.value });
                      }}
                    />
                  </div>
                </td>
                <td className="px-1 py-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                    onClick={() => handleRemoveRow(r.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() =>
            rows.length > 1 && handleRemoveRow(rows[rows.length - 1].id)
          }
          disabled={rows.length <= 1}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-xs w-6 text-center">{rows.length}</span>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleAddRow}
        >
          <Plus className="w-3 h-3" />
        </Button>
        <span className="text-xs text-muted-foreground ml-1">rows</span>
      </div>
    </div>
  );
}

// ─── Fixed Charge List Editor ───

function FixedChargeListEditor({
  matrix,
  onRefresh,
}: {
  matrix: MatrixData;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { rows } = matrix;
  const updateMatrixMutation = useUpdateMatrix(matrix.supplierId);

  const handleAddCharge = async () => {
    try {
      await addRow(matrix.id, {
        rowLabel: "New charge",
        unitCost: "0.0000",
        perUnit: matrix.units ? `per ${matrix.units}` : undefined,
      });
      onRefresh();
    } catch {
      toast({ title: "Failed to add charge", variant: "destructive" });
    }
  };

  const handleRemoveCharge = async (rowId: string) => {
    try {
      await removeRow(matrix.id, rowId);
      onRefresh();
    } catch {
      toast({ title: "Failed to remove charge", variant: "destructive" });
    }
  };

  const handleUpdateCharge = async (
    rowId: string,
    data: Record<string, unknown>,
  ) => {
    try {
      await updateRow(matrix.id, rowId, data);
      onRefresh();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Increment + Units */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Increment</Label>
          <Input
            className="h-7 w-20 text-xs"
            defaultValue={matrix.increment || ""}
            placeholder="e.g. 1"
            onBlur={(e) => {
              updateMatrixMutation.mutate({
                id: matrix.id,
                data: { increment: e.target.value },
              });
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Units</Label>
          <Input
            className="h-7 w-24 text-xs"
            defaultValue={matrix.units || ""}
            placeholder="e.g. Colors"
            onBlur={(e) => {
              updateMatrixMutation.mutate({
                id: matrix.id,
                data: { units: e.target.value },
              });
            }}
          />
        </div>
      </div>

      {/* Charge list */}
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 border rounded-md px-3 py-2"
        >
          <input
            className="flex-1 text-sm bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
            defaultValue={r.rowLabel}
            placeholder="Description"
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val !== r.rowLabel)
                handleUpdateCharge(r.id, { rowLabel: val });
            }}
          />
          <span className="text-xs text-muted-foreground">$</span>
          <input
            type="number"
            step="0.0001"
            className="w-24 text-sm text-right bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
            defaultValue={parseFloat(r.unitCost || "0").toFixed(4)}
            onBlur={(e) => {
              handleUpdateCharge(r.id, { unitCost: e.target.value });
            }}
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {r.perUnit || `per ${matrix.units || "unit"}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
            onClick={() => handleRemoveCharge(r.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <button
        className="text-xs text-primary hover:underline"
        onClick={handleAddCharge}
      >
        + Add Charge
      </button>
    </div>
  );
}

// ─── Decoration Section (single collapsible card) ───

function DecorationSection({
  matrixId,
  supplierId,
}: {
  matrixId: string;
  supplierId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);

  const { data: matrix, isLoading } = useQuery<MatrixData>({
    queryKey: matrixKeys.detail(matrixId),
    enabled: !!matrixId,
  });

  const updateMatrixMutation = useUpdateMatrix(supplierId);
  const deleteMatrixMutation = useDeleteMatrix(supplierId);
  const copyMatrixMutation = useCopyMatrix(supplierId);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: matrixKeys.detail(matrixId) });
  }, [queryClient, matrixId]);

  if (isLoading || !matrix) {
    return (
      <Card className="border">
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </CardContent>
      </Card>
    );
  }

  const chargeLabel =
    matrix.chargeType === "run" ? "Run Charge" : "Fixed Charge";
  const displayLabel =
    matrix.displayType === "table"
      ? "Table"
      : matrix.displayType === "per_item"
        ? "Per Item"
        : "List";

  return (
    <Card className="border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm">{matrix.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({chargeLabel})
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {displayLabel}
            </Badge>
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="xs">
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{matrix.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this decoration and all its
                      pricing data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => deleteMatrixMutation.mutate(matrix.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                size="xs"
                className=""
                onClick={() => copyMatrixMutation.mutate(matrix.id)}
                disabled={copyMatrixMutation.isPending}
              >
                {copyMatrixMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* Settings row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Charge Name</Label>
                <Input
                  className="text-sm"
                  defaultValue={matrix.name}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && val !== matrix.name)
                      updateMatrixMutation.mutate({
                        id: matrix.id,
                        data: { name: val },
                      });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Charge Type</Label>
                <Select
                  value={matrix.chargeType}
                  onValueChange={(val) =>
                    updateMatrixMutation.mutate({
                      id: matrix.id,
                      data: { chargeType: val },
                    })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="run">Run Charge</SelectItem>
                    <SelectItem value="fixed">Fixed Charge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Display Type</Label>
                <Tabs value={matrix.displayType} onValueChange={(val) =>
                  updateMatrixMutation.mutate({
                  id: matrix.id,
                  data: { displayType: val },
                  })
                }>
                  <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table" className="text-xs">Table</TabsTrigger>
                  <TabsTrigger value="per_item" className="text-xs">Per Item</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {matrix.displayType === "table" && (
              <div>
                <Label className="text-xs">
                  Row Basis (what rows represent)
                </Label>
                <Input
                  className="text-sm"
                  defaultValue={matrix.rowBasis || ""}
                  placeholder="e.g. Colors, Stitches"
                  onBlur={(e) => {
                    updateMatrixMutation.mutate({
                      id: matrix.id,
                      data: { rowBasis: e.target.value },
                    });
                  }}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <Label className="text-xs">Description (internal)</Label>
              <Textarea
                className="text-sm h-16 resize-none"
                defaultValue={matrix.description || ""}
                placeholder="Internal notes about this decoration pricing..."
                onBlur={(e) => {
                  updateMatrixMutation.mutate({
                    id: matrix.id,
                    data: { description: e.target.value },
                  });
                }}
              />
            </div>

            {/* Editor based on display type */}
            {matrix.displayType === "table" ? (
              <RunChargeTableEditor
                matrix={matrix}
                supplierId={supplierId}
                onRefresh={handleRefresh}
              />
            ) : matrix.displayType === "per_item" ? (
              <PerItemEditor matrix={matrix} onRefresh={handleRefresh} />
            ) : matrix.displayType === "list" ? (
              <FixedChargeListEditor
                matrix={matrix}
                onRefresh={handleRefresh}
              />
            ) : (
              <FixedChargeTableEditor
                matrix={matrix}
                onRefresh={handleRefresh}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ─── Main Tab ───

export function DecoratorMatrixTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch decorators (suppliers marked as decorator)
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });
  const decorators = useMemo(
    () => suppliers.filter((s: any) => s.isDecorator),
    [suppliers],
  );

  const [selectedDecoratorId, setSelectedDecoratorId] = useState<string>("");
  const [showAddDecoration, setShowAddDecoration] = useState(false);

  // Auto-select first decorator
  useEffect(() => {
    if (decorators.length > 0 && !selectedDecoratorId) {
      setSelectedDecoratorId(decorators[0].id);
    }
  }, [decorators, selectedDecoratorId]);

  const selectedDecorator = decorators.find(
    (d: any) => d.id === selectedDecoratorId,
  );

  // Fetch matrices for selected decorator
  const { data: matrices = [], isLoading: matricesLoading } = useQuery<any[]>({
    queryKey: matrixKeys.bySupplier(selectedDecoratorId),
    enabled: !!selectedDecoratorId,
  });

  const createMatrixMutation = useCreateSupplierMatrix(selectedDecoratorId);

  // New decoration form state
  const [newName, setNewName] = useState("");
  const [newChargeType, setNewChargeType] = useState("run");
  const [newDisplayType, setNewDisplayType] = useState("table");

  const handleCreateDecoration = () => {
    if (!newName) return;
    createMatrixMutation.mutate(
      {
        name: newName,
        chargeType: newChargeType,
        displayType: newDisplayType,
      },
      {
        onSuccess: () => {
          setShowAddDecoration(false);
          setNewName("");
          setNewChargeType("run");
          setNewDisplayType("table");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Decorator selector */}
      <div>
        <Label className="text-sm font-medium">Decorator (Vendor)</Label>
        <div className="flex items-center gap-2 mt-1">
          {decorators.length > 0 ? (
            <Select
              value={selectedDecoratorId}
              onValueChange={setSelectedDecoratorId}
            >
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select decorator..." />
              </SelectTrigger>
              <SelectContent>
                {decorators.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No vendors marked as decorators. Mark a vendor as "Decorator" in
              vendor settings first.
            </p>
          )}
        </div>
      </div>

      {/* Decorator name */}
      {selectedDecorator && (
        <>
          <div>
            <h3 className="text-lg font-bold">{selectedDecorator.name}</h3>
            <p className="text-sm text-muted-foreground">
              {matrices.length} decoration{matrices.length !== 1 ? "s" : ""}{" "}
              configured
            </p>
          </div>

          {/* Loading */}
          {matricesLoading && (
            <div className="flex items-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading
              decorations...
            </div>
          )}

          {/* Stacked decoration sections */}
          <div className="space-y-3">
            {matrices.map((m: any) => (
              <DecorationSection
                key={m.id}
                matrixId={m.id}
                supplierId={selectedDecoratorId}
              />
            ))}
          </div>

          {/* Add New Decoration */}
          {showAddDecoration ? (
            <Card className="border-2 border-dashed border-primary/30">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold">New Decoration</h4>
                <div>
                  <Label className="text-xs">Charge Name *</Label>
                  <Input
                    className="text-sm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Screen Printing"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Charge Type</Label>
                    <Select
                      value={newChargeType}
                      onValueChange={setNewChargeType}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="run">Run Charge</SelectItem>
                        <SelectItem value="fixed">Fixed Charge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Display Type</Label>
                    <Select
                      value={newDisplayType}
                      onValueChange={setNewDisplayType}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="per_item">Per Item</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateDecoration}
                    disabled={
                      !newName || createMatrixMutation.isPending
                    }
                  >
                    {createMatrixMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddDecoration(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="default"
              className="w-full"
              onClick={() => setShowAddDecoration(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Decoration
            </Button>
          )}
        </>
      )}
    </div>
  );
}
