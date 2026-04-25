import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSOEditDialog } from "./hooks";

interface SOEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  updateField: (fields: Record<string, unknown>, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
  isFieldPending: boolean;
}

export default function SOEditDialog({
  open,
  onOpenChange,
  order,
  updateField,
  isFieldPending,
}: SOEditDialogProps) {
  const { toast } = useToast();
  const { paymentTermsOptions, taxCodes } = useSOEditDialog();
  const [form, setForm] = useState<Record<string, unknown>>({});

  // Populate form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        notes: order?.notes || "",
        paymentTerms: order?.paymentTerms || "",
        customerPo: order?.customerPo || "",
        margin: order?.margin || "",
        orderDiscount: order?.orderDiscount || "",
        defaultTaxCodeId: order?.defaultTaxCodeId || "none",
        inHandsDate: order?.inHandsDate ? new Date(String(order.inHandsDate)).toISOString().split("T")[0] : "",
        eventDate: order?.eventDate ? new Date(String(order.eventDate)).toISOString().split("T")[0] : "",
        supplierInHandsDate: order?.supplierInHandsDate ? new Date(String(order.supplierInHandsDate)).toISOString().split("T")[0] : "",
        isFirm: order?.isFirm || false,
        supplierNotes: order?.supplierNotes || "",
        additionalInformation: order?.additionalInformation || "",
      });
    }
  }, [open, order]);

  const handleSave = () => {
    const payload: Record<string, unknown> = { ...form };
    if (payload.defaultTaxCodeId === "none") payload.defaultTaxCodeId = null;
    if (!payload.inHandsDate) payload.inHandsDate = null;
    if (!payload.eventDate) payload.eventDate = null;
    if (!payload.supplierInHandsDate) payload.supplierInHandsDate = null;
    updateField(payload, {
      onSuccess: () => {
        toast({ title: "Order details updated" });
        onOpenChange(false);
      },
      onError: (error: Error) => {
        toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-gray-500">Introduction / Notes</Label>
            <Textarea
              value={String(form.notes || "")}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Order introduction / notes..."
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Payment Terms</Label>
              <Select value={String(form.paymentTerms || "")} onValueChange={(val) => setForm({ ...form, paymentTerms: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((t) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Customer PO</Label>
              <Input
                value={String(form.customerPo || "")}
                onChange={(e) => setForm({ ...form, customerPo: e.target.value })}
                placeholder="PO #"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Default Margin (%)</Label>
              <Input
                type="number"
                value={String(form.margin || "")}
                onChange={(e) => setForm({ ...form, margin: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Discount (%)</Label>
              <Input
                type="number"
                value={String(form.orderDiscount || "")}
                onChange={(e) => setForm({ ...form, orderDiscount: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tax Code</Label>
              <Select value={String(form.defaultTaxCodeId || "none")} onValueChange={(val) => setForm({ ...form, defaultTaxCodeId: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tax code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {taxCodes.map((tc) => (
                    <SelectItem key={tc.id} value={String(tc.id)}>
                      {tc.label} {tc.rate ? `(${tc.rate}%)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">In-Hands Date</Label>
              <Input
                type="date"
                value={String(form.inHandsDate || "")}
                onChange={(e) => setForm({ ...form, inHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Event Date</Label>
              <Input
                type="date"
                value={String(form.eventDate || "")}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Supplier In-Hands Date</Label>
              <Input
                type="date"
                value={String(form.supplierInHandsDate || "")}
                onChange={(e) => setForm({ ...form, supplierInHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isFirmEdit"
              checked={!!form.isFirm}
              onCheckedChange={(checked) => setForm({ ...form, isFirm: !!checked })}
            />
            <Label htmlFor="isFirmEdit" className="text-sm font-normal cursor-pointer">Firm Order</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Supplier Notes</Label>
              <Textarea
                value={String(form.supplierNotes || "")}
                onChange={(e) => setForm({ ...form, supplierNotes: e.target.value })}
                placeholder="Notes visible to suppliers on POs..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Additional Information</Label>
              <Textarea
                value={String(form.additionalInformation || "")}
                onChange={(e) => setForm({ ...form, additionalInformation: e.target.value })}
                placeholder="Other relevant details..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isFieldPending}>
            {isFieldPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
