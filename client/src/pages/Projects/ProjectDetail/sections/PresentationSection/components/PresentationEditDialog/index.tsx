import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { usePresentationSection } from "../../hooks";

interface PresentationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hook: ReturnType<typeof usePresentationSection>;
  projectId: string;
}

export default function PresentationEditDialog({
  open,
  onOpenChange,
  hook,
  projectId,
}: PresentationEditDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string | boolean | null>>({});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        inHandsDate: hook.order?.inHandsDate ? format(new Date(hook.order.inHandsDate), "yyyy-MM-dd") : "",
        introduction: hook.introduction || "",
        clientContactId: hook.selectedContact || "",
        expiryDate: hook.expiryDate || "",
        currency: hook.currency || "USD",
        hidePricing: hook.hidePricing || false,
      });
    }
  }, [open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const presSettings: Record<string, unknown> = {
        introduction: form.introduction,
        clientContactId: form.clientContactId,
        expiryDate: form.expiryDate || null,
        currency: form.currency,
        hidePricing: form.hidePricing,
      };

      hook.setIntroduction(form.introduction as string);
      hook.setSelectedContact(form.clientContactId as string);
      hook.setExpiryDate(form.expiryDate as string);
      hook.setCurrency(form.currency as string);
      hook.setHidePricing(form.hidePricing as boolean);

      hook.saveSettingsMutation.mutate(presSettings, {
        onSuccess: () => {
          toast({ title: "Presentation details updated" });
        },
        onError: (error: Error) => {
          toast({ title: "Failed to update", description: error.message, variant: "destructive" });
        },
      });

      const currentIHD = hook.order?.inHandsDate ? format(new Date(hook.order.inHandsDate), "yyyy-MM-dd") : "";
      if (form.inHandsDate !== currentIHD) {
        const { updateProject } = await import("@/services/projects/requests");
        await updateProject(projectId, { inHandsDate: (form.inHandsDate as string) || null });
      }

      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Failed to update", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Presentation Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-gray-500">In-Hands Date</Label>
            <Input
              type="date"
              value={(form.inHandsDate as string) || ""}
              onChange={(e) => setForm({ ...form, inHandsDate: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Introduction</Label>
            <Textarea
              value={(form.introduction as string) || ""}
              onChange={(e) => setForm({ ...form, introduction: e.target.value })}
              placeholder="Add a message or introduction for this presentation..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Client Contact</Label>
              <Select value={(form.clientContactId as string) || ""} onValueChange={(val) => setForm({ ...form, clientContactId: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {hook.contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.firstName} | {contact.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Expiry Date</Label>
              <Input
                type="date"
                value={(form.expiryDate as string) || ""}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Currency</Label>
              <Select value={(form.currency as string) || "USD"} onValueChange={(val) => setForm({ ...form, currency: val })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="hidePricingEdit"
                checked={(form.hidePricing as boolean) || false}
                onChange={(e) => setForm({ ...form, hidePricing: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="hidePricingEdit" className="text-sm text-gray-600">Hide Pricing</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
