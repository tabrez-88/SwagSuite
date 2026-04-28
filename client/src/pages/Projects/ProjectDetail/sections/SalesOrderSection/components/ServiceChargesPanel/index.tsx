import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAddServiceCharge,
  useUpdateServiceCharge,
  useDeleteServiceCharge,
} from "@/services/projects/mutations";
import { useProjectServiceCharges } from "@/services/projects/queries";
import { useTaxCodes } from "@/services/tax-codes/queries";
import type { OrderServiceCharge } from "@shared/schema";
import { Check, DollarSign, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const CHARGE_TYPES = [
  { value: "freight", label: "Freight" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "shipping", label: "Shipping" },
  { value: "rush_fee", label: "Rush Fee" },
  { value: "other", label: "Other" },
  { value: "custom", label: "Custom" },
] as const;

interface ServiceChargesPanelProps {
  projectId: string | number;
  isLocked: boolean;
  /** When true, renders inline without Card wrapper (for embedding in ProductsSection) */
  embedded?: boolean;
  /** Ref to expose openAdd so parent can trigger "+ Service" button */
  onRegisterAdd?: (fn: () => void) => void;
}

interface ChargeFormState {
  chargeType: string;
  description: string;
  quantity: string;
  unitCost: string;
  unitPrice: string;
  taxable: boolean;
  taxCodeId: string;
  displayToClient: boolean;
  includeInMargin: boolean;
  notes: string;
}

const emptyForm: ChargeFormState = {
  chargeType: "freight",
  description: "",
  quantity: "1",
  unitCost: "0",
  unitPrice: "0",
  taxable: false,
  taxCodeId: "",
  displayToClient: true,
  includeInMargin: false,
  notes: "",
};

function chargeTypeLabel(type: string) {
  return CHARGE_TYPES.find((t) => t.value === type)?.label || type;
}

export default function ServiceChargesPanel({ projectId, isLocked, embedded, onRegisterAdd }: ServiceChargesPanelProps) {
  const { data: charges = [] } = useProjectServiceCharges(projectId);
  const { data: taxCodesList = [] } = useTaxCodes();
  const taxCodeMap = new Map(taxCodesList.map((tc) => [tc.id, tc]));
  const addMutation = useAddServiceCharge(projectId);
  const updateMutation = useUpdateServiceCharge(projectId);
  const deleteMutation = useDeleteServiceCharge(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<OrderServiceCharge | null>(null);
  const [form, setForm] = useState<ChargeFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<OrderServiceCharge | null>(null);

  const openAdd = () => {
    setEditingCharge(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (charge: OrderServiceCharge) => {
    setEditingCharge(charge);
    setForm({
      chargeType: charge.chargeType,
      description: charge.description,
      quantity: String(charge.quantity ?? 1),
      unitCost: String(charge.unitCost ?? "0"),
      unitPrice: String(charge.unitPrice ?? "0"),
      taxable: charge.taxable ?? false,
      taxCodeId: charge.taxCodeId || "",
      displayToClient: charge.displayToClient ?? true,
      includeInMargin: charge.includeInMargin ?? false,
      notes: charge.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      chargeType: form.chargeType,
      description: form.description,
      quantity: parseInt(form.quantity) || 1,
      unitCost: form.unitCost,
      unitPrice: form.unitPrice,
      taxable: form.taxable,
      taxCodeId: form.taxable && form.taxCodeId ? form.taxCodeId : null,
      displayToClient: form.displayToClient,
      includeInMargin: form.includeInMargin,
      notes: form.notes || null,
    };

    if (editingCharge) {
      updateMutation.mutate(
        { chargeId: editingCharge.id, data: payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      addMutation.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;
  const totalAmount = charges.reduce(
    (sum, c) => sum + (c.quantity ?? 1) * parseFloat(String(c.unitPrice ?? "0")),
    0,
  );

  // Register openAdd for parent "+ Service" button
  useEffect(() => {
    onRegisterAdd?.(openAdd);
  }, [onRegisterAdd, openAdd]);

  const serviceTable = charges.length === 0 ? null : (
    <Table>
      <TableHeader className="bg-gray-100 border-b">
        <TableRow>
          <TableHead className="text-black p-3 font-bold">Description</TableHead>
          <TableHead className="text-black text-center p-3 font-bold w-20">Type</TableHead>
          <TableHead className="text-black text-center p-3 font-bold w-20">QTY</TableHead>
          <TableHead className="text-black text-center p-3 font-bold w-20">Cost</TableHead>
          <TableHead className="text-black text-center p-3 font-bold w-20">Price</TableHead>
          <TableHead className="text-black text-center p-3 font-bold w-20">Amount</TableHead>
          <TableHead className="text-black text-center p-3 font-bold w-24">Tax</TableHead>
          {!isLocked && <TableHead className="w-[80px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {charges.map((charge) => {
          const qty = charge.quantity ?? 1;
          const price = parseFloat(String(charge.unitPrice ?? "0"));
          const cost = parseFloat(String(charge.unitCost ?? "0"));
          return (
            <TableRow key={charge.id}>
              <TableCell className="font-medium">
                {charge.description}
                {!charge.displayToClient && (
                  <span className="text-xs text-muted-foreground ml-1">(internal)</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {chargeTypeLabel(charge.chargeType)}
              </TableCell>
              <TableCell className="text-center">{qty}</TableCell>
              <TableCell className="text-right">${cost.toFixed(2)}</TableCell>
              <TableCell className="text-right">${price.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">
                ${(qty * price).toFixed(2)}
              </TableCell>
              <TableCell className="text-center text-xs">
                {charge.taxable ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    {charge.taxCodeId && taxCodeMap.get(charge.taxCodeId) ? (
                      <span className="text-muted-foreground">{taxCodeMap.get(charge.taxCodeId)!.label}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              {!isLocked && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(charge)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteTarget(charge)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const serviceContent = embedded ? (
    // Embedded mode: inline section within ProductsSection
    charges.length > 0 ? (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Services & Fees</span>
          <span className="text-xs text-muted-foreground">
            ({charges.length} item{charges.length !== 1 ? "s" : ""} · ${totalAmount.toFixed(2)})
          </span>
        </div>
        {serviceTable}
      </div>
    ) : null
  ) : (
    // Standalone mode: own Card wrapper
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Services & Fees
            {charges.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({charges.length} item{charges.length !== 1 ? "s" : ""} · $
                {totalAmount.toFixed(2)})
              </span>
            )}
          </CardTitle>
          {!isLocked && (
            <Button size="sm" variant="outline" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              Service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {charges.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No service charges yet.{" "}
            {!isLocked && 'Click "+ Service" to add freight, fulfillment, or other fees.'}
          </div>
        ) : (
          serviceTable
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {serviceContent}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCharge ? "Edit Service Charge" : "Add Service Charge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-gray-500">Charge Type</Label>
              <Select
                value={form.chargeType}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    chargeType: val,
                    description: form.description || chargeTypeLabel(val),
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Ground Shipping"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Unit Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Unit Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sc-taxable"
                  checked={form.taxable}
                  onCheckedChange={(c) => setForm({ ...form, taxable: !!c, taxCodeId: c ? form.taxCodeId : "" })}
                />
                <Label htmlFor="sc-taxable" className="text-sm font-normal cursor-pointer">
                  Taxable
                </Label>
              </div>
              {form.taxable && (
                <div className="ml-6">
                  <Label className="text-xs text-gray-500">Tax Code</Label>
                  <Select
                    value={form.taxCodeId || "__order_default__"}
                    onValueChange={(val) => setForm({ ...form, taxCodeId: val === "__order_default__" ? "" : val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__order_default__">Use Order Tax Code (default)</SelectItem>
                      {taxCodesList.map((tc) => (
                        <SelectItem key={tc.id} value={String(tc.id)}>
                          {tc.label} ({tc.rate}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sc-display"
                  checked={form.displayToClient}
                  onCheckedChange={(c) => setForm({ ...form, displayToClient: !!c })}
                />
                <Label htmlFor="sc-display" className="text-sm font-normal cursor-pointer">
                  Display to Client
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sc-margin"
                  checked={form.includeInMargin}
                  onCheckedChange={(c) => setForm({ ...form, includeInMargin: !!c })}
                />
                <Label htmlFor="sc-margin" className="text-sm font-normal cursor-pointer">
                  Include in Margin
                </Label>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Internal notes..."
                className="mt-1 min-h-[50px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.description.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCharge ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Charge</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.description}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
