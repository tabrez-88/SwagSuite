import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IMPRINT_METHODS } from "@/constants/imprintOptions";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "@/lib/wouter-compat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid3X3, Loader2, Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface DecoratorMatrixDialogProps {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  artworkId?: string;
  artworkMethod?: string;
  quantity?: number;
  projectId?: string | number;
  readOnly?: boolean;
}

export default function DecoratorMatrixDialog({ open, supplierId, supplierName, onClose, artworkId, artworkMethod, quantity, projectId, readOnly = false }: DecoratorMatrixDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: matrices = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/suppliers/${supplierId}/matrices`],
    enabled: open && !!supplierId,
  });

  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [showAddMatrix, setShowAddMatrix] = useState(false);
  const [newMatrixName, setNewMatrixName] = useState("");
  const [newMatrixMethod, setNewMatrixMethod] = useState("");
  const [newMatrixType, setNewMatrixType] = useState("run_charge_table");

  // Load matrix detail with entries
  const { data: matrixDetail } = useQuery<any>({
    queryKey: [`/api/matrices/${selectedMatrixId}`],
    enabled: !!selectedMatrixId,
  });

  useEffect(() => {
    if (matrices.length > 0 && !selectedMatrixId) {
      setSelectedMatrixId(matrices[0].id);
    }
  }, [matrices, selectedMatrixId]);

  // Mutations
  const createMatrixMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/suppliers/${supplierId}/matrices`, data);
      return res.json();
    },
    onSuccess: (newMatrix) => {
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/matrices`] });
      setSelectedMatrixId(newMatrix.id);
      setShowAddMatrix(false);
      setNewMatrixName("");
      setNewMatrixMethod("");
      setNewMatrixType("run_charge_table");
      toast({ title: "Matrix created" });
    },
  });

  const deleteMatrixMutation = useMutation({
    mutationFn: async (matrixId: string) => {
      await apiRequest("DELETE", `/api/matrices/${matrixId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/matrices`] });
      setSelectedMatrixId(null);
      toast({ title: "Matrix deleted" });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async ({ matrixId, entry }: { matrixId: string; entry: any }) => {
      const res = await apiRequest("POST", `/api/matrices/${matrixId}/entries`, entry);
      return res.json();
    },
    onSuccess: () => {
      if (selectedMatrixId) queryClient.invalidateQueries({ queryKey: [`/api/matrices/${selectedMatrixId}`] });
      toast({ title: "Entry added" });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async ({ matrixId, entryId }: { matrixId: string; entryId: string }) => {
      await apiRequest("DELETE", `/api/matrices/${matrixId}/entries/${entryId}`);
    },
    onSuccess: () => {
      if (selectedMatrixId) queryClient.invalidateQueries({ queryKey: [`/api/matrices/${selectedMatrixId}`] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ matrixId, entryId, updates }: { matrixId: string; entryId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/matrices/${matrixId}/entries/${entryId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      if (selectedMatrixId) queryClient.invalidateQueries({ queryKey: [`/api/matrices/${selectedMatrixId}`] });
    },
  });

  const applyToArtworkMutation = useMutation({
    mutationFn: async ({ artworkId, supplierId, quantity }: { artworkId: string; supplierId: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/matrices/apply", { artworkId, supplierId, quantity });
      return res.json();
    },
    onSuccess: (data) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/items-with-details`] });
      }
      if (data.applied) {
        toast({ title: "Matrix applied", description: `${data.charges.length} charge(s) from "${data.matrixName}"` });
        onClose();
      } else {
        toast({ title: "Could not apply", description: data.message, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Failed to apply matrix", variant: "destructive" });
    },
  });

  const [newEntry, setNewEntry] = useState({ minQuantity: 1, maxQuantity: "", setupCost: "0", runCost: "0", additionalColorCost: "0", colorCount: 1 });
  const [newSimpleEntry, setNewSimpleEntry] = useState({ rowLabel: "", unitCost: "0", minQuantity: 1, maxQuantity: "" });

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
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {matrices.length > 0 ? (
                <Select value={selectedMatrixId || ""} onValueChange={setSelectedMatrixId}>
                  <SelectTrigger><SelectValue placeholder="Select matrix..." /></SelectTrigger>
                  <SelectContent>
                    {matrices.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.decorationMethod}
                        {m.isDefault && " (default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-400">No matrices yet</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddMatrix(true)} className={readOnly ? "hidden" : ""}>
              <Plus className="w-3 h-3 mr-1" /> New Matrix
            </Button>
            {selectedMatrixId && !readOnly && (
              <Button variant="ghost" size="sm" className="text-red-500"
                onClick={() => { if (confirm("Delete this matrix?")) deleteMatrixMutation.mutate(selectedMatrixId); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Add matrix form */}
          {showAddMatrix && !readOnly && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Matrix Name *</Label>
                    <Input value={newMatrixName} onChange={(e) => setNewMatrixName(e.target.value)} placeholder="e.g., Standard Screen Print Pricing" />
                  </div>
                  <div>
                    <Label>Decoration Method *</Label>
                    <Select value={newMatrixMethod} onValueChange={setNewMatrixMethod}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        {IMPRINT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Matrix Type</Label>
                  <Select value={newMatrixType} onValueChange={setNewMatrixType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="run_charge_table">Run Charge Table</SelectItem>
                      <SelectItem value="run_charge_per_item">Run Charge Per Item</SelectItem>
                      <SelectItem value="fixed_charge_table">Fixed Charge Table</SelectItem>
                      <SelectItem value="fixed_charge_list">Fixed Charge List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!newMatrixName || !newMatrixMethod || createMatrixMutation.isPending}
                    onClick={() => createMatrixMutation.mutate({ name: newMatrixName, decorationMethod: newMatrixMethod, matrixType: newMatrixType })}>
                    {createMatrixMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Create
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddMatrix(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matrix entries */}
          {matrixDetail && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold">{matrixDetail.name}</h4>
                <Badge variant="outline" className="text-xs">{matrixDetail.decorationMethod}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {matrixDetail.matrixType === "run_charge_per_item" ? "Per Item" :
                   matrixDetail.matrixType === "fixed_charge_table" ? "Fixed Table" :
                   matrixDetail.matrixType === "fixed_charge_list" ? "Fixed List" :
                   "Run Charge Table"}
                </Badge>
              </div>

              {/* Non-table types */}
              {matrixDetail.matrixType && matrixDetail.matrixType !== "run_charge_table" ? (
                <div className="border rounded-lg overflow-hidden">
                  {/* Header row for fixed_charge_table (has qty columns) */}
                  {matrixDetail.matrixType === "fixed_charge_table" ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-2.5 font-medium text-xs">Label</th>
                          <th className="text-left p-2.5 font-medium text-xs w-20">Min Qty</th>
                          <th className="text-left p-2.5 font-medium text-xs w-20">Max Qty</th>
                          <th className="text-right p-2.5 font-medium text-xs w-24">Unit Cost</th>
                          {!readOnly && <th className="w-8"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(matrixDetail.entries || []).map((entry: any) => (
                          <tr key={entry.id} className="border-b last:border-0">
                            <td className="p-1.5">
                              {readOnly ? <span className="text-xs px-1">{entry.rowLabel || "—"}</span> : (
                              <input className="text-xs w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
                                defaultValue={entry.rowLabel || ""} placeholder="Label"
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val !== (entry.rowLabel || "")) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { rowLabel: val } });
                                }} />
                              )}
                            </td>
                            <td className="p-1.5">
                              {readOnly ? <span className="text-xs px-1">{entry.minQuantity}</span> : (
                              <input type="number" min={0} className="h-7 text-xs w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                                defaultValue={entry.minQuantity} onBlur={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  if (val !== entry.minQuantity) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { minQuantity: val } });
                                }} />
                              )}
                            </td>
                            <td className="p-1.5">
                              {readOnly ? <span className="text-xs px-1">{entry.maxQuantity ?? "∞"}</span> : (
                              <input type="number" min={0} placeholder="∞" className="h-7 text-xs w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                                defaultValue={entry.maxQuantity ?? ""} onBlur={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  if (val !== entry.maxQuantity) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { maxQuantity: val } });
                                }} />
                              )}
                            </td>
                            <td className="p-1.5">
                              {readOnly ? <span className="text-xs text-right block px-1">${parseFloat(entry.unitCost || "0").toFixed(2)}</span> : (
                              <input type="number" step="0.01" min={0} className="h-7 text-xs text-right w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                                defaultValue={parseFloat(entry.unitCost || "0").toFixed(2)} onBlur={(e) => {
                                  const val = e.target.value;
                                  if (val !== entry.unitCost) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { unitCost: val } });
                                }} />
                              )}
                            </td>
                            {!readOnly && (
                            <td className="p-1.5">
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                onClick={() => deleteEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id })}>
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </Button>
                            </td>
                            )}
                          </tr>
                        ))}
                        {/* Add entry row */}
                        {!readOnly && (
                        <tr className="bg-gray-50/50">
                          <td className="p-1.5">
                            <Input className="h-7 text-xs" placeholder="e.g. Tape charge"
                              value={newSimpleEntry.rowLabel} onChange={(e) => setNewSimpleEntry(p => ({ ...p, rowLabel: e.target.value }))} />
                          </td>
                          <td className="p-1.5">
                            <Input className="h-7 text-xs" type="number" min={0}
                              value={newSimpleEntry.minQuantity} onChange={(e) => setNewSimpleEntry(p => ({ ...p, minQuantity: parseInt(e.target.value) || 0 }))} />
                          </td>
                          <td className="p-1.5">
                            <Input className="h-7 text-xs" type="number" min={0} placeholder="∞"
                              value={newSimpleEntry.maxQuantity} onChange={(e) => setNewSimpleEntry(p => ({ ...p, maxQuantity: e.target.value }))} />
                          </td>
                          <td className="p-1.5">
                            <Input className="h-7 text-xs text-right" type="number" step="0.01" min={0}
                              value={newSimpleEntry.unitCost} onChange={(e) => setNewSimpleEntry(p => ({ ...p, unitCost: e.target.value }))} />
                          </td>
                          <td className="p-1.5">
                            <Button variant="default" size="sm" className="h-7 w-7 p-0"
                              disabled={!newSimpleEntry.rowLabel || addEntryMutation.isPending}
                              onClick={() => {
                                addEntryMutation.mutate({
                                  matrixId: matrixDetail.id,
                                  entry: {
                                    rowLabel: newSimpleEntry.rowLabel,
                                    unitCost: newSimpleEntry.unitCost,
                                    minQuantity: newSimpleEntry.minQuantity,
                                    maxQuantity: newSimpleEntry.maxQuantity ? parseInt(newSimpleEntry.maxQuantity) : null,
                                  },
                                });
                                setNewSimpleEntry({ rowLabel: "", unitCost: "0", minQuantity: 1, maxQuantity: "" });
                              }}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    /* run_charge_per_item / fixed_charge_list: simple label + cost */
                    <div className="p-4 space-y-2">
                      {(matrixDetail.entries || []).map((entry: any) => (
                        <div key={entry.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                          {readOnly ? <span className="flex-1 text-sm px-1">{entry.rowLabel || "—"}</span> : (
                          <input
                            className="flex-1 text-sm bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
                            defaultValue={entry.rowLabel || ""} placeholder="Label"
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (entry.rowLabel || "")) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { rowLabel: val } });
                            }}
                          />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">$</span>
                            {readOnly ? <span className="w-20 text-sm text-right font-medium">{parseFloat(entry.unitCost || "0").toFixed(2)}</span> : (
                            <input type="number" step="0.01" min={0}
                              className="w-20 text-sm text-right font-medium bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
                              defaultValue={parseFloat(entry.unitCost || "0").toFixed(2)}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val !== entry.unitCost) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { unitCost: val } });
                              }}
                            />
                            )}
                            {entry.perUnit && <span className="text-xs text-muted-foreground">{entry.perUnit}</span>}
                            {!readOnly && (
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                              onClick={() => deleteEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id })}>
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Add entry row */}
                      {!readOnly && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Input className="flex-1 h-7 text-xs" placeholder={matrixDetail.matrixType === "run_charge_per_item" ? "e.g. Poly bagging" : "e.g. Screen setup"}
                          value={newSimpleEntry.rowLabel} onChange={(e) => setNewSimpleEntry(p => ({ ...p, rowLabel: e.target.value }))} />
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input className="w-20 h-7 text-xs text-right" type="number" step="0.01" min={0}
                          value={newSimpleEntry.unitCost} onChange={(e) => setNewSimpleEntry(p => ({ ...p, unitCost: e.target.value }))} />
                        <Button variant="default" size="sm" className="h-7 w-7 p-0"
                          disabled={!newSimpleEntry.rowLabel || addEntryMutation.isPending}
                          onClick={() => {
                            addEntryMutation.mutate({
                              matrixId: matrixDetail.id,
                              entry: { rowLabel: newSimpleEntry.rowLabel, unitCost: newSimpleEntry.unitCost },
                            });
                            setNewSimpleEntry({ rowLabel: "", unitCost: "0", minQuantity: 1, maxQuantity: "" });
                          }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Run charge table */
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-2.5 font-medium text-xs">Min Qty</th>
                      <th className="text-left p-2.5 font-medium text-xs">Max Qty</th>
                      <th className="text-left p-2.5 font-medium text-xs">Colors</th>
                      <th className="text-right p-2.5 font-medium text-xs">Setup Cost</th>
                      <th className="text-right p-2.5 font-medium text-xs">Run Cost</th>
                      <th className="text-right p-2.5 font-medium text-xs">Add'l Color</th>
                      {!readOnly && <th className="w-8"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(matrixDetail.entries || []).map((entry: any) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="p-1.5">
                          {readOnly ? <span className="text-xs px-1">{entry.minQuantity}</span> : (
                          <input type="number" min={0} className="h-7 text-xs w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                            defaultValue={entry.minQuantity} onBlur={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              if (val !== entry.minQuantity) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { minQuantity: val } });
                            }} />
                          )}
                        </td>
                        <td className="p-1.5">
                          {readOnly ? <span className="text-xs px-1">{entry.maxQuantity ?? "∞"}</span> : (
                          <input type="number" min={0} placeholder="∞" className="h-7 text-xs w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                            defaultValue={entry.maxQuantity ?? ""} onBlur={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              if (val !== entry.maxQuantity) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { maxQuantity: val } });
                            }} />
                          )}
                        </td>
                        <td className="p-1.5">
                          {readOnly ? <span className="text-xs px-1">{entry.colorCount}</span> : (
                          <input type="number" min={1} className="h-7 text-xs w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                            defaultValue={entry.colorCount} onBlur={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              if (val !== entry.colorCount) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { colorCount: val } });
                            }} />
                          )}
                        </td>
                        <td className="p-1.5">
                          {readOnly ? <span className="text-xs text-right block px-1">${parseFloat(entry.setupCost || "0").toFixed(2)}</span> : (
                          <input type="number" step="0.01" min={0} className="h-7 text-xs text-right w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                            defaultValue={parseFloat(entry.setupCost || "0").toFixed(2)} onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== entry.setupCost) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { setupCost: val } });
                            }} />
                          )}
                        </td>
                        <td className="p-1.5">
                          {readOnly ? <span className="text-xs text-right block px-1">${parseFloat(entry.runCost || "0").toFixed(2)}</span> : (
                          <input type="number" step="0.01" min={0} className="h-7 text-xs text-right w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                            defaultValue={parseFloat(entry.runCost || "0").toFixed(2)} onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== entry.runCost) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { runCost: val } });
                            }} />
                          )}
                        </td>
                        <td className="p-1.5">
                          {readOnly ? <span className="text-xs text-right block px-1">${parseFloat(entry.additionalColorCost || "0").toFixed(2)}</span> : (
                          <input type="number" step="0.01" min={0} className="h-7 text-xs text-right w-full bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
                            defaultValue={parseFloat(entry.additionalColorCost || "0").toFixed(2)} onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== entry.additionalColorCost) updateEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id, updates: { additionalColorCost: val } });
                            }} />
                          )}
                        </td>
                        {!readOnly && (
                        <td className="p-1.5">
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                            onClick={() => deleteEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id })}>
                            <Trash2 className="w-3 h-3 text-gray-400" />
                          </Button>
                        </td>
                        )}
                      </tr>
                    ))}
                    {/* Add entry row */}
                    {!readOnly && (
                    <tr className="bg-gray-50/50">
                      <td className="p-1.5">
                        <Input className="h-7 text-xs" type="number" min={1}
                          value={newEntry.minQuantity} onChange={(e) => setNewEntry(p => ({ ...p, minQuantity: parseInt(e.target.value) || 1 }))} />
                      </td>
                      <td className="p-1.5">
                        <Input className="h-7 text-xs" type="number" min={0} placeholder="∞"
                          value={newEntry.maxQuantity} onChange={(e) => setNewEntry(p => ({ ...p, maxQuantity: e.target.value }))} />
                      </td>
                      <td className="p-1.5">
                        <Input className="h-7 text-xs" type="number" min={1}
                          value={newEntry.colorCount} onChange={(e) => setNewEntry(p => ({ ...p, colorCount: parseInt(e.target.value) || 1 }))} />
                      </td>
                      <td className="p-1.5">
                        <Input className="h-7 text-xs text-right" type="number" step="0.01" min={0}
                          value={newEntry.setupCost} onChange={(e) => setNewEntry(p => ({ ...p, setupCost: e.target.value }))} />
                      </td>
                      <td className="p-1.5">
                        <Input className="h-7 text-xs text-right" type="number" step="0.01" min={0}
                          value={newEntry.runCost} onChange={(e) => setNewEntry(p => ({ ...p, runCost: e.target.value }))} />
                      </td>
                      <td className="p-1.5">
                        <Input className="h-7 text-xs text-right" type="number" step="0.01" min={0}
                          value={newEntry.additionalColorCost} onChange={(e) => setNewEntry(p => ({ ...p, additionalColorCost: e.target.value }))} />
                      </td>
                      <td className="p-1.5">
                        <Button variant="default" size="sm" className="h-7 w-7 p-0"
                          disabled={addEntryMutation.isPending}
                          onClick={() => {
                            addEntryMutation.mutate({
                              matrixId: matrixDetail.id,
                              entry: {
                                minQuantity: newEntry.minQuantity,
                                maxQuantity: newEntry.maxQuantity ? parseInt(newEntry.maxQuantity) : null,
                                colorCount: newEntry.colorCount,
                                setupCost: newEntry.setupCost,
                                runCost: newEntry.runCost,
                                additionalColorCost: newEntry.additionalColorCost,
                              },
                            });
                            setNewEntry({ minQuantity: 1, maxQuantity: "", setupCost: "0", runCost: "0", additionalColorCost: "0", colorCount: 1 });
                          }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                    )}
                  </tbody>
                </table>
              </div>
              )}

              {/* Apply to Artwork button */}
              {artworkId && matrixDetail && (matrixDetail.entries || []).length > 0 && (
                <Button
                  className="w-full mt-3"
                  disabled={applyToArtworkMutation.isPending}
                  onClick={() => {
                    applyToArtworkMutation.mutate({ artworkId, supplierId, quantity: quantity || 1 });
                  }}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  {applyToArtworkMutation.isPending ? "Applying..." : `Apply "${matrixDetail.name}" to Artwork`}
                </Button>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
