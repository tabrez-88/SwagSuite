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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImprintOptions } from "@/services/imprint-options";
import { useToast } from "@/hooks/use-toast";
import {
  createMatrixEntry,
  updateMatrixEntry,
  deleteMatrixEntry,
  updateMatrix,
  deleteMatrix,
  copyMatrix,
  createSupplierMatrix,
} from "@/services/decorator-matrix/requests";
import { patchSupplier } from "@/services/suppliers/requests";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Edit,
  Grid3X3,
  List,
  Loader2,
  Plus,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type MatrixType =
  | "run_charge_table"
  | "run_charge_per_item"
  | "fixed_charge_table"
  | "fixed_charge_list";

const MATRIX_TYPE_OPTIONS: {
  value: MatrixType;
  label: string;
  description: string;
  icon: typeof Grid3X3;
}[] = [
  {
    value: "run_charge_table",
    label: "Run Charge Table",
    description: "2D grid: rows (colors/stitches) × columns (qty breaks)",
    icon: Grid3X3,
  },
  {
    value: "run_charge_per_item",
    label: "Run Charge Per Item",
    description: "Simple list: item name + cost per item",
    icon: List,
  },
  {
    value: "fixed_charge_table",
    label: "Fixed Charge Table",
    description: "Rows with label + single cost value",
    icon: Table2,
  },
  {
    value: "fixed_charge_list",
    label: "Fixed Charge List",
    description: "Charges with cost + per-unit increment",
    icon: List,
  },
];

function getMatrixTypeLabel(type: string) {
  return (
    MATRIX_TYPE_OPTIONS.find((o) => o.value === type)?.label ||
    "Run Charge Table"
  );
}

// ─── Run Charge Table Editor (2D grid) ───

function RunChargeTableEditor({
  matrixId,
  entries,
}: {
  matrixId: string;
  entries: any[];
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newEntry, setNewEntry] = useState({
    minQuantity: 1,
    maxQuantity: "",
    setupCost: "0",
    runCost: "0",
    additionalColorCost: "0",
    colorCount: 1,
  });

  const addMutation = useMutation({
    mutationFn: async (entry: any) => {
      return createMatrixEntry(matrixId, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
      setNewEntry({
        minQuantity: 1,
        maxQuantity: "",
        setupCost: "0",
        runCost: "0",
        additionalColorCost: "0",
        colorCount: 1,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      entryId,
      data,
    }: {
      entryId: string;
      data: any;
    }) => {
      return updateMatrixEntry(matrixId, entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await deleteMatrixEntry(matrixId, entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left p-2.5 font-medium text-xs">Min Qty</th>
            <th className="text-left p-2.5 font-medium text-xs">Max Qty</th>
            <th className="text-left p-2.5 font-medium text-xs">Colors</th>
            <th className="text-right p-2.5 font-medium text-xs">Setup Cost</th>
            <th className="text-right p-2.5 font-medium text-xs">Run Cost</th>
            <th className="text-right p-2.5 font-medium text-xs">Add'l Color</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onUpdate={(data) =>
                updateMutation.mutate({ entryId: entry.id, data })
              }
              onDelete={() => deleteMutation.mutate(entry.id)}
            />
          ))}
          <tr className="bg-muted/30">
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                type="number"
                min={0}
                value={newEntry.minQuantity}
                onChange={(e) =>
                  setNewEntry((p) => ({
                    ...p,
                    minQuantity: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                type="number"
                min={0}
                placeholder="∞"
                value={newEntry.maxQuantity}
                onChange={(e) =>
                  setNewEntry((p) => ({ ...p, maxQuantity: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                type="number"
                min={1}
                value={newEntry.colorCount}
                onChange={(e) =>
                  setNewEntry((p) => ({
                    ...p,
                    colorCount: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs text-right"
                type="number"
                step="0.01"
                min={0}
                value={newEntry.setupCost}
                onChange={(e) =>
                  setNewEntry((p) => ({ ...p, setupCost: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs text-right"
                type="number"
                step="0.01"
                min={0}
                value={newEntry.runCost}
                onChange={(e) =>
                  setNewEntry((p) => ({ ...p, runCost: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs text-right"
                type="number"
                step="0.01"
                min={0}
                value={newEntry.additionalColorCost}
                onChange={(e) =>
                  setNewEntry((p) => ({
                    ...p,
                    additionalColorCost: e.target.value,
                  }))
                }
              />
            </td>
            <td className="p-1.5">
              <Button
                variant="default"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={addMutation.isPending}
                onClick={() =>
                  addMutation.mutate({
                    minQuantity: newEntry.minQuantity,
                    maxQuantity: newEntry.maxQuantity
                      ? parseInt(newEntry.maxQuantity)
                      : null,
                    colorCount: newEntry.colorCount,
                    setupCost: newEntry.setupCost,
                    runCost: newEntry.runCost,
                    additionalColorCost: newEntry.additionalColorCost,
                  })
                }
              >
                <Plus className="w-3 h-3" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Inline-editable row for run_charge_table
function EntryRow({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(entry);

  if (!editing) {
    return (
      <tr
        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
        onDoubleClick={() => {
          setForm(entry);
          setEditing(true);
        }}
      >
        <td className="p-2.5 text-xs">{entry.minQuantity}</td>
        <td className="p-2.5 text-xs">{entry.maxQuantity ?? "∞"}</td>
        <td className="p-2.5 text-xs">{entry.colorCount}</td>
        <td className="p-2.5 text-xs text-right">
          ${parseFloat(entry.setupCost || "0").toFixed(2)}
        </td>
        <td className="p-2.5 text-xs text-right">
          ${parseFloat(entry.runCost || "0").toFixed(2)}
        </td>
        <td className="p-2.5 text-xs text-right">
          ${parseFloat(entry.additionalColorCost || "0").toFixed(2)}
        </td>
        <td className="p-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b last:border-0 bg-blue-50/50">
      <td className="p-1.5">
        <Input
          className="h-7 text-xs"
          type="number"
          value={form.minQuantity}
          onChange={(e) =>
            setForm((p: any) => ({
              ...p,
              minQuantity: parseInt(e.target.value) || 0,
            }))
          }
        />
      </td>
      <td className="p-1.5">
        <Input
          className="h-7 text-xs"
          type="number"
          placeholder="∞"
          value={form.maxQuantity ?? ""}
          onChange={(e) =>
            setForm((p: any) => ({
              ...p,
              maxQuantity: e.target.value ? parseInt(e.target.value) : null,
            }))
          }
        />
      </td>
      <td className="p-1.5">
        <Input
          className="h-7 text-xs"
          type="number"
          value={form.colorCount}
          onChange={(e) =>
            setForm((p: any) => ({
              ...p,
              colorCount: parseInt(e.target.value) || 1,
            }))
          }
        />
      </td>
      <td className="p-1.5">
        <Input
          className="h-7 text-xs text-right"
          type="number"
          step="0.01"
          value={form.setupCost}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, setupCost: e.target.value }))
          }
        />
      </td>
      <td className="p-1.5">
        <Input
          className="h-7 text-xs text-right"
          type="number"
          step="0.01"
          value={form.runCost}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, runCost: e.target.value }))
          }
        />
      </td>
      <td className="p-1.5">
        <Input
          className="h-7 text-xs text-right"
          type="number"
          step="0.01"
          value={form.additionalColorCost}
          onChange={(e) =>
            setForm((p: any) => ({
              ...p,
              additionalColorCost: e.target.value,
            }))
          }
        />
      </td>
      <td className="p-1.5 flex gap-0.5">
        <Button
          variant="default"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            onUpdate({
              minQuantity: form.minQuantity,
              maxQuantity: form.maxQuantity,
              colorCount: form.colorCount,
              setupCost: form.setupCost,
              runCost: form.runCost,
              additionalColorCost: form.additionalColorCost,
            });
            setEditing(false);
          }}
        >
          ✓
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setEditing(false)}
        >
          <X className="w-3 h-3" />
        </Button>
      </td>
    </tr>
  );
}

// ─── Run Charge Per Item Editor ───

function RunChargePerItemEditor({
  matrixId,
  entries,
}: {
  matrixId: string;
  entries: any[];
}) {
  const queryClient = useQueryClient();
  const [newRow, setNewRow] = useState({ rowLabel: "", unitCost: "0" });

  const addMutation = useMutation({
    mutationFn: async (entry: any) => {
      return createMatrixEntry(matrixId, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
      setNewRow({ rowLabel: "", unitCost: "0" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      entryId,
      data,
    }: {
      entryId: string;
      data: any;
    }) => {
      return updateMatrixEntry(matrixId, entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await deleteMatrixEntry(matrixId, entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left p-2.5 font-medium text-xs">Item Name</th>
            <th className="text-right p-2.5 font-medium text-xs w-40">
              Cost Per Unit
            </th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <tr key={entry.id} className="border-b last:border-0">
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                  defaultValue={entry.rowLabel || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (entry.rowLabel || ""))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { rowLabel: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs text-right border-0 bg-transparent px-0 focus-visible:ring-0"
                  type="number"
                  step="0.01"
                  defaultValue={parseFloat(entry.unitCost || "0").toFixed(2)}
                  onBlur={(e) => {
                    if (e.target.value !== parseFloat(entry.unitCost || "0").toFixed(2))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { unitCost: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => deleteMutation.mutate(entry.id)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
          <tr className="bg-muted/30">
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="e.g., Hang Tag"
                value={newRow.rowLabel}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, rowLabel: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs text-right"
                type="number"
                step="0.01"
                value={newRow.unitCost}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, unitCost: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Button
                variant="default"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={!newRow.rowLabel || addMutation.isPending}
                onClick={() =>
                  addMutation.mutate({
                    rowLabel: newRow.rowLabel,
                    unitCost: newRow.unitCost,
                    minQuantity: 0,
                  })
                }
              >
                <Plus className="w-3 h-3" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Fixed Charge Table Editor ───

function FixedChargeTableEditor({
  matrixId,
  entries,
}: {
  matrixId: string;
  entries: any[];
}) {
  const queryClient = useQueryClient();
  const [newRow, setNewRow] = useState({ rowLabel: "", unitCost: "0" });

  const addMutation = useMutation({
    mutationFn: async (entry: any) => {
      return createMatrixEntry(matrixId, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
      setNewRow({ rowLabel: "", unitCost: "0" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      entryId,
      data,
    }: {
      entryId: string;
      data: any;
    }) => {
      return updateMatrixEntry(matrixId, entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await deleteMatrixEntry(matrixId, entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left p-2.5 font-medium text-xs">Label</th>
            <th className="text-right p-2.5 font-medium text-xs w-40">Cost</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <tr key={entry.id} className="border-b last:border-0">
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                  defaultValue={entry.rowLabel || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (entry.rowLabel || ""))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { rowLabel: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs text-right border-0 bg-transparent px-0 focus-visible:ring-0"
                  type="number"
                  step="0.01"
                  defaultValue={parseFloat(entry.unitCost || "0").toFixed(2)}
                  onBlur={(e) => {
                    if (e.target.value !== parseFloat(entry.unitCost || "0").toFixed(2))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { unitCost: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => deleteMutation.mutate(entry.id)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
          <tr className="bg-muted/30">
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="e.g., 0-5000 stitches"
                value={newRow.rowLabel}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, rowLabel: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs text-right"
                type="number"
                step="0.01"
                value={newRow.unitCost}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, unitCost: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Button
                variant="default"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={!newRow.rowLabel || addMutation.isPending}
                onClick={() =>
                  addMutation.mutate({
                    rowLabel: newRow.rowLabel,
                    unitCost: newRow.unitCost,
                    minQuantity: 0,
                  })
                }
              >
                <Plus className="w-3 h-3" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Fixed Charge List Editor ───

function FixedChargeListEditor({
  matrixId,
  entries,
}: {
  matrixId: string;
  entries: any[];
}) {
  const queryClient = useQueryClient();
  const [newRow, setNewRow] = useState({
    rowLabel: "",
    unitCost: "0",
    perUnit: "",
  });

  const addMutation = useMutation({
    mutationFn: async (entry: any) => {
      return createMatrixEntry(matrixId, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
      setNewRow({ rowLabel: "", unitCost: "0", perUnit: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      entryId,
      data,
    }: {
      entryId: string;
      data: any;
    }) => {
      return updateMatrixEntry(matrixId, entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await deleteMatrixEntry(matrixId, entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left p-2.5 font-medium text-xs">
              Description
            </th>
            <th className="text-right p-2.5 font-medium text-xs w-32">Cost</th>
            <th className="text-left p-2.5 font-medium text-xs w-40">
              Per Unit
            </th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <tr key={entry.id} className="border-b last:border-0">
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                  defaultValue={entry.rowLabel || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (entry.rowLabel || ""))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { rowLabel: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs text-right border-0 bg-transparent px-0 focus-visible:ring-0"
                  type="number"
                  step="0.01"
                  defaultValue={parseFloat(entry.unitCost || "0").toFixed(2)}
                  onBlur={(e) => {
                    if (e.target.value !== parseFloat(entry.unitCost || "0").toFixed(2))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { unitCost: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Input
                  className="h-7 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                  defaultValue={entry.perUnit || ""}
                  placeholder="e.g., per color"
                  onBlur={(e) => {
                    if (e.target.value !== (entry.perUnit || ""))
                      updateMutation.mutate({
                        entryId: entry.id,
                        data: { perUnit: e.target.value },
                      });
                  }}
                />
              </td>
              <td className="p-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => deleteMutation.mutate(entry.id)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
          <tr className="bg-muted/30">
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="e.g., Screen setup"
                value={newRow.rowLabel}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, rowLabel: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs text-right"
                type="number"
                step="0.01"
                value={newRow.unitCost}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, unitCost: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="per color"
                value={newRow.perUnit}
                onChange={(e) =>
                  setNewRow((p) => ({ ...p, perUnit: e.target.value }))
                }
              />
            </td>
            <td className="p-1.5">
              <Button
                variant="default"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={!newRow.rowLabel || addMutation.isPending}
                onClick={() =>
                  addMutation.mutate({
                    rowLabel: newRow.rowLabel,
                    unitCost: newRow.unitCost,
                    perUnit: newRow.perUnit,
                    minQuantity: 0,
                  })
                }
              >
                <Plus className="w-3 h-3" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Matrix Detail Panel ───

function MatrixDetailPanel({
  matrixId,
  supplierId,
  onDeleted,
}: {
  matrixId: string;
  supplierId: string;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: matrix, isLoading } = useQuery<any>({
    queryKey: [`/api/matrices/${matrixId}`],
    enabled: !!matrixId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return updateMatrix(matrixId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/matrices/${matrixId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/suppliers/${supplierId}/matrices`],
      });
      toast({ title: "Matrix updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteMatrix(matrixId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/suppliers/${supplierId}/matrices`],
      });
      toast({ title: "Matrix deleted" });
      onDeleted();
    },
  });

  const copyMutation = useMutation({
    mutationFn: async () => {
      return copyMatrix(matrixId, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/suppliers/${supplierId}/matrices`],
      });
      toast({ title: "Matrix copied" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!matrix) return null;

  const matrixType: MatrixType = matrix.matrixType || "run_charge_table";
  const entries = matrix.entries || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold">{matrix.name}</h3>
            <Badge variant="outline" className="text-xs">
              {matrix.decorationMethod?.replace(/_/g, " ")}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getMatrixTypeLabel(matrixType)}
            </Badge>
            {matrix.isDefault && <Badge className="text-xs">Default</Badge>}
          </div>
          {matrix.description && (
            <p className="text-xs text-muted-foreground">
              {matrix.description}
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyMutation.mutate()}
            disabled={copyMutation.isPending}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500">
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Matrix</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{matrix.name}" and all its
                  entries. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Inline metadata editing */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Charge Name</Label>
          <Input
            className="h-8 text-sm"
            defaultValue={matrix.name}
            onBlur={(e) => {
              if (e.target.value && e.target.value !== matrix.name)
                updateMutation.mutate({ name: e.target.value });
            }}
          />
        </div>
        <div>
          <Label className="text-xs">Description (internal)</Label>
          <Input
            className="h-8 text-sm"
            defaultValue={matrix.description || ""}
            placeholder="Internal reference notes..."
            onBlur={(e) => {
              if (e.target.value !== (matrix.description || ""))
                updateMutation.mutate({ description: e.target.value || null });
            }}
          />
        </div>
      </div>

      {/* Row basis for table types */}
      {(matrixType === "run_charge_table" || matrixType === "fixed_charge_table") && (
        <div className="max-w-xs">
          <Label className="text-xs">Rows based on</Label>
          <Input
            className="h-8 text-sm"
            defaultValue={matrix.rowBasis || ""}
            placeholder="colors, stitches, ..."
            onBlur={(e) => {
              if (e.target.value !== (matrix.rowBasis || ""))
                updateMutation.mutate({ rowBasis: e.target.value || null });
            }}
          />
        </div>
      )}

      {/* Increment + Units for fixed_charge_list */}
      {matrixType === "fixed_charge_list" && (
        <div className="flex gap-3 max-w-sm">
          <div className="flex-1">
            <Label className="text-xs">Increment</Label>
            <Input
              className="h-8 text-sm"
              defaultValue={matrix.increment || ""}
              placeholder="e.g., 1"
              onBlur={(e) => {
                if (e.target.value !== (matrix.increment || ""))
                  updateMutation.mutate({ increment: e.target.value || null });
              }}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Units</Label>
            <Input
              className="h-8 text-sm"
              defaultValue={matrix.units || ""}
              placeholder="colors, stitches, ..."
              onBlur={(e) => {
                if (e.target.value !== (matrix.units || ""))
                  updateMutation.mutate({ units: e.target.value || null });
              }}
            />
          </div>
        </div>
      )}

      {/* Type-specific editor */}
      {matrixType === "run_charge_table" && (
        <RunChargeTableEditor matrixId={matrixId} entries={entries} />
      )}
      {matrixType === "run_charge_per_item" && (
        <RunChargePerItemEditor matrixId={matrixId} entries={entries} />
      )}
      {matrixType === "fixed_charge_table" && (
        <FixedChargeTableEditor matrixId={matrixId} entries={entries} />
      )}
      {matrixType === "fixed_charge_list" && (
        <FixedChargeListEditor matrixId={matrixId} entries={entries} />
      )}

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No entries yet. Add rows using the table above.
        </p>
      )}
    </div>
  );
}

// ─── Main Tab Component ───

export function DecoratorMatrixTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: imprintMethods = [] } = useImprintOptions("method");

  // Supplier selector
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);

  // Vendor notes
  const [vendorNotes, setVendorNotes] = useState("");
  const selectedSupplier = suppliers.find((s: any) => s.id === selectedSupplierId);

  // New matrix form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMethod, setNewMethod] = useState("");
  const [newChargeType, setNewChargeType] = useState<"run" | "fixed">("run");
  const [newSubType, setNewSubType] = useState<"table" | "per_item" | "list">("table");

  // Derive matrix type from charge type + sub type
  const derivedMatrixType: MatrixType =
    newChargeType === "run"
      ? (newSubType === "per_item" ? "run_charge_per_item" : "run_charge_table")
      : (newSubType === "list" ? "fixed_charge_list" : "fixed_charge_table");

  // Matrices for selected supplier
  const { data: matrices = [], isLoading: matricesLoading } = useQuery<any[]>({
    queryKey: [`/api/suppliers/${selectedSupplierId}/matrices`],
    enabled: !!selectedSupplierId,
  });

  // Auto-select first decorator
  useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplierId) {
      const firstDecorator = suppliers.find((s: any) => s.isDecorator);
      if (firstDecorator) setSelectedSupplierId(firstDecorator.id);
    }
  }, [suppliers, selectedSupplierId]);

  // Reset matrix selection when supplier changes
  useEffect(() => {
    setSelectedMatrixId(null);
  }, [selectedSupplierId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return createSupplierMatrix(selectedSupplierId!, data);
    },
    onSuccess: (newMatrix) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/suppliers/${selectedSupplierId}/matrices`],
      });
      setSelectedMatrixId(newMatrix.id);
      setShowAdd(false);
      setNewName("");
      setNewMethod("");
      setNewChargeType("run");
      setNewSubType("table");
      toast({ title: "Matrix created" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="w-5 h-5" />
            Decorator Pricing Matrices
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage pricing lookup tables for decoration services per vendor.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Decorator (supplier) selector */}
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <Label className="text-xs font-medium">Decorator</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={(v) => setSelectedSupplierId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter((s: any) => s.isDecorator)
                    .map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {suppliers.filter((s: any) => s.isDecorator).length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      No vendors marked as decorator. Go to CRM → Vendors to toggle the Decorator switch.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor notes */}
          {selectedSupplierId && (
            <div>
              <Label className="text-xs font-medium">Decorator Notes</Label>
              <Textarea
                className="text-sm mt-1"
                rows={2}
                placeholder="Key information or relevant notes about this decorator (internal reference only)..."
                defaultValue={selectedSupplier?.notes || ""}
                onBlur={async (e) => {
                  try {
                    await patchSupplier(selectedSupplierId!, { notes: e.target.value });
                  } catch { /* ignore */ }
                }}
              />
            </div>
          )}

          {!selectedSupplierId && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a decorator/vendor above to manage their pricing matrices.
            </p>
          )}

          {selectedSupplierId && (
            <div className="space-y-4">
              {/* Decorations list */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Decorations</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Decoration
                </Button>
              </div>

              {/* Add decoration form */}
              {showAdd && (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">
                          Charge Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Shown to client and decorator"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">
                          Decoration Method{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select value={newMethod} onValueChange={setNewMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {imprintMethods.filter(
                              (m) => m.value !== "none"
                            ).map((m) => (
                              <SelectItem key={m.id} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Charge Type</Label>
                        <Select value={newChargeType} onValueChange={(v: any) => {
                          setNewChargeType(v);
                          setNewSubType(v === "run" ? "table" : "table");
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="run">Run charge</SelectItem>
                            <SelectItem value="fixed">Fixed charge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={newSubType} onValueChange={(v: any) => setNewSubType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="table">Table</SelectItem>
                            {newChargeType === "run" && (
                              <SelectItem value="per_item">Per Item</SelectItem>
                            )}
                            {newChargeType === "fixed" && (
                              <SelectItem value="list">List</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={
                          !newName ||
                          !newMethod ||
                          createMutation.isPending
                        }
                        onClick={() =>
                          createMutation.mutate({
                            name: newName,
                            decorationMethod: newMethod,
                            matrixType: derivedMatrixType,
                          })
                        }
                      >
                        {createMutation.isPending && (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        )}
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdd(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Matrix list */}
              {matricesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : matrices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pricing matrices for this vendor yet. Click "Add
                  Decoration" to create one.
                </p>
              ) : (
                <div className="space-y-1">
                  {matrices.map((m: any) => (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedMatrixId === m.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        setSelectedMatrixId(
                          selectedMatrixId === m.id ? null : m.id
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{m.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {m.decorationMethod?.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getMatrixTypeLabel(m.matrixType || "run_charge_table")}
                        </Badge>
                        {m.isDefault && (
                          <Badge className="text-xs">Default</Badge>
                        )}
                      </div>
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected matrix detail */}
              {selectedMatrixId && (
                <Card>
                  <CardContent className="p-4">
                    <MatrixDetailPanel
                      key={selectedMatrixId}
                      matrixId={selectedMatrixId}
                      supplierId={selectedSupplierId}
                      onDeleted={() => setSelectedMatrixId(null)}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
