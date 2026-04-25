import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { useQuoteEditDialog } from "./hooks";

interface QuoteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  updateField: (fields: Record<string, unknown>, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
  isFieldPending: boolean;
}

export default function QuoteEditDialog({
  open,
  onOpenChange,
  order,
  updateField,
  isFieldPending,
}: QuoteEditDialogProps) {
  const { toast } = useToast();
  const { paymentTermsOptions, taxCodes } = useQuoteEditDialog();
  const [form, setForm] = useState<Record<string, string | null>>({});

  React.useEffect(() => {
    if (open) {
      setForm({
        inHandsDate: order?.inHandsDate ? new Date(String(order.inHandsDate)).toISOString().split("T")[0] : "",
        supplierInHandsDate: order?.supplierInHandsDate ? new Date(String(order.supplierInHandsDate)).toISOString().split("T")[0] : "",
        customerPo: order?.customerPo || "",
        paymentTerms: order?.paymentTerms || "",
        currency: order?.currency || "USD",
        defaultTaxCodeId: order?.defaultTaxCodeId || "none",
        quoteIntroduction: order?.quoteIntroduction || "",
        supplierNotes: order?.supplierNotes || "",
        additionalInformation: order?.additionalInformation || "",
      });
    }
  }, [open]);

  const handleSave = () => {
    const payload: Record<string, string | null> = { ...form };
    if (payload.defaultTaxCodeId === "none") payload.defaultTaxCodeId = null;
    if (!payload.inHandsDate) payload.inHandsDate = null;
    if (!payload.supplierInHandsDate) payload.supplierInHandsDate = null;
    updateField(payload, {
      onSuccess: () => {
        toast({ title: "Quote details updated" });
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
          <DialogTitle>Edit Quote Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">In-Hands Date</Label>
              <Input
                type="date"
                value={form.inHandsDate || ""}
                onChange={(e) => setForm({ ...form, inHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Supplier In-Hands Date</Label>
              <Input
                type="date"
                value={form.supplierInHandsDate || ""}
                onChange={(e) => setForm({ ...form, supplierInHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Customer PO</Label>
              <Input
                value={form.customerPo || ""}
                onChange={(e) => setForm({ ...form, customerPo: e.target.value })}
                placeholder="Enter PO #"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Payment Terms</Label>
              <Select value={form.paymentTerms || ""} onValueChange={(val) => setForm({ ...form, paymentTerms: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((t) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Currency</Label>
              <Input
                value={form.currency || ""}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="USD"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tax Code</Label>
              <Select value={form.defaultTaxCodeId || "none"} onValueChange={(val) => setForm({ ...form, defaultTaxCodeId: val })}>
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
          </div>
          <div>
            <Label className="text-xs text-gray-500">Introduction</Label>
            <Textarea
              value={form.quoteIntroduction || ""}
              onChange={(e) => setForm({ ...form, quoteIntroduction: e.target.value })}
              placeholder="Introduction message for the quote (visible to client)..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Supplier Notes</Label>
              <Textarea
                value={form.supplierNotes || ""}
                onChange={(e) => setForm({ ...form, supplierNotes: e.target.value })}
                placeholder="Notes visible to suppliers on POs..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Additional Information</Label>
              <Textarea
                value={form.additionalInformation || ""}
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
