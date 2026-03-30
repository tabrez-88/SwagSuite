import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IMPRINT_METHODS } from "@/constants/imprintOptions";
import { Grid3X3, Loader2, Plus, Trash2 } from "lucide-react";

interface DecoratorMatrixDialogProps {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
}

export default function DecoratorMatrixDialog({ open, supplierId, supplierName, onClose }: DecoratorMatrixDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matrices = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/suppliers/${supplierId}/matrices`],
    enabled: open && !!supplierId,
  });

  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [showAddMatrix, setShowAddMatrix] = useState(false);
  const [newMatrixName, setNewMatrixName] = useState("");
  const [newMatrixMethod, setNewMatrixMethod] = useState("");

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

  const [newEntry, setNewEntry] = useState({ minQuantity: 1, maxQuantity: "", setupCost: "0", runCost: "0", additionalColorCost: "0", colorCount: 1 });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Decorator Matrix — {supplierName}
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
            <Button variant="outline" size="sm" onClick={() => setShowAddMatrix(true)}>
              <Plus className="w-3 h-3 mr-1" /> New Matrix
            </Button>
            {selectedMatrixId && (
              <Button variant="ghost" size="sm" className="text-red-500"
                onClick={() => { if (confirm("Delete this matrix?")) deleteMatrixMutation.mutate(selectedMatrixId); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Add matrix form */}
          {showAddMatrix && (
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
                <div className="flex gap-2">
                  <Button size="sm" disabled={!newMatrixName || !newMatrixMethod || createMatrixMutation.isPending}
                    onClick={() => createMatrixMutation.mutate({ name: newMatrixName, decorationMethod: newMatrixMethod })}>
                    {createMatrixMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Create
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddMatrix(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matrix entries table */}
          {matrixDetail && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold">{matrixDetail.name}</h4>
                <Badge variant="outline" className="text-xs">{matrixDetail.decorationMethod}</Badge>
              </div>

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
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(matrixDetail.entries || []).map((entry: any) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="p-2.5 text-xs">{entry.minQuantity}</td>
                        <td className="p-2.5 text-xs">{entry.maxQuantity ?? "∞"}</td>
                        <td className="p-2.5 text-xs">{entry.colorCount}</td>
                        <td className="p-2.5 text-xs text-right">${parseFloat(entry.setupCost || "0").toFixed(2)}</td>
                        <td className="p-2.5 text-xs text-right">${parseFloat(entry.runCost || "0").toFixed(2)}</td>
                        <td className="p-2.5 text-xs text-right">${parseFloat(entry.additionalColorCost || "0").toFixed(2)}</td>
                        <td className="p-2.5">
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                            onClick={() => deleteEntryMutation.mutate({ matrixId: matrixDetail.id, entryId: entry.id })}>
                            <Trash2 className="w-3 h-3 text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Add entry row */}
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
                  </tbody>
                </table>
              </div>
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
