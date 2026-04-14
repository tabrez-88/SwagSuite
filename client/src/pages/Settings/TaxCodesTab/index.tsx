import { useState } from "react";
import {
  useTaxCodes,
  useCreateTaxCode,
  useUpdateTaxCode,
  useDeleteTaxCode,
} from "@/services/tax-codes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Receipt, Star } from "lucide-react";

interface TaxCode {
  id: string;
  label: string;
  description: string | null;
  rate: string;
  taxjarProductCode: string | null;
  isExempt: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TaxCodeFormData {
  label: string;
  description: string;
  rate: string;
  taxjarProductCode: string;
  isExempt: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: TaxCodeFormData = {
  label: "",
  description: "",
  rate: "0",
  taxjarProductCode: "",
  isExempt: false,
  isDefault: false,
};

export function TaxCodesTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<TaxCode | null>(null);
  const [formData, setFormData] = useState<TaxCodeFormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: taxCodes = [], isLoading } = useTaxCodes() as unknown as {
    data: TaxCode[];
    isLoading: boolean;
  };

  const _create = useCreateTaxCode();
  const createMutation = {
    ..._create,
    mutate: (data: TaxCodeFormData) =>
      _create.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast({ title: "Tax code created" });
        },
        onError: (err: Error) =>
          toast({ title: "Error", description: err.message, variant: "destructive" }),
      }),
  };

  const _update = useUpdateTaxCode();
  const updateMutation = {
    ..._update,
    mutate: ({ id, data }: { id: string; data: Partial<TaxCodeFormData> }) =>
      _update.mutate(
        { id, data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingCode(null);
            toast({ title: "Tax code updated" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      ),
  };

  const _delete = useDeleteTaxCode();
  const deleteMutation = {
    ..._delete,
    mutate: (id: string) =>
      _delete.mutate(id, {
        onSuccess: () => {
          setDeleteId(null);
          toast({ title: "Tax code deleted" });
        },
        onError: (err: Error) =>
          toast({ title: "Error", description: err.message, variant: "destructive" }),
      }),
  };

  const openCreate = () => {
    setEditingCode(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (code: TaxCode) => {
    setEditingCode(code);
    setFormData({
      label: code.label,
      description: code.description || "",
      rate: code.rate,
      taxjarProductCode: code.taxjarProductCode || "",
      isExempt: code.isExempt,
      isDefault: code.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Tax Codes
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Add Tax Code
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage tax codes for your orders. Each code can have a manual rate or an
            optional TaxJar product code for automated calculation. Assign a default tax code to
            auto-apply on new orders.
          </p>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tax codes...</div>
          ) : taxCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tax codes yet. Click "Add Tax Code" to create your first one.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Rate %</TableHead>
                    <TableHead>TaxJar Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {code.label}
                          {code.isDefault && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {code.description || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {code.isExempt ? "Exempt" : `${parseFloat(code.rate).toFixed(3)}%`}
                      </TableCell>
                      <TableCell>
                        {code.taxjarProductCode ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {code.taxjarProductCode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.isExempt ? (
                          <Badge variant="secondary">Exempt</Badge>
                        ) : code.taxjarProductCode ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Auto (TaxJar)
                          </Badge>
                        ) : (
                          <Badge variant="outline">Manual Rate</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(code)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(code.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Tax Code" : "New Tax Code"}</DialogTitle>
            <DialogDescription>
              {editingCode
                ? "Update the tax code configuration."
                : "Create a new tax code for your orders."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                placeholder="e.g., NY Sales Tax"
                value={formData.label}
                onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (client-facing)</Label>
              <Input
                id="description"
                placeholder="e.g., New York State Sales Tax"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate %</Label>
              <Input
                id="rate"
                type="number"
                step="0.001"
                min="0"
                max="100"
                placeholder="8.875"
                value={formData.rate}
                onChange={(e) => setFormData((f) => ({ ...f, rate: e.target.value }))}
                disabled={formData.isExempt}
              />
              <p className="text-xs text-muted-foreground">
                Used as fallback when TaxJar is not configured or calculation fails.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxjarProductCode">TaxJar Product Code (optional)</Label>
              <Input
                id="taxjarProductCode"
                placeholder="e.g., 20010 (Clothing)"
                value={formData.taxjarProductCode}
                onChange={(e) => setFormData((f) => ({ ...f, taxjarProductCode: e.target.value }))}
                disabled={formData.isExempt}
              />
              <p className="text-xs text-muted-foreground">
                If set, TaxJar will use this code for accurate per-item tax calculation.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isExempt"
                  checked={formData.isExempt}
                  onCheckedChange={(c) =>
                    setFormData((f) => ({ ...f, isExempt: !!c, rate: c ? "0" : f.rate }))
                  }
                />
                <Label htmlFor="isExempt" className="font-normal cursor-pointer">
                  Tax Exempt
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(c) => setFormData((f) => ({ ...f, isDefault: !!c }))}
                />
                <Label htmlFor="isDefault" className="font-normal cursor-pointer">
                  Default for new orders
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !formData.label.trim()}>
                {isPending ? "Saving..." : editingCode ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this tax code. It cannot be deleted if it's currently
              assigned to any orders, items, or companies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
