import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShippingAccount } from "@/services/shipping-accounts";

interface ShippingAccountFormProps {
  form: Partial<ShippingAccount>;
  onChange: (updates: Partial<ShippingAccount>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit: boolean;
}

export const COURIER_OPTIONS = [
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
] as const;

export function ShippingAccountForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  isEdit,
}: ShippingAccountFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name *</Label>
        <Input
          id="accountName"
          placeholder="e.g., LSD Main UPS Account"
          value={form.accountName ?? ""}
          onChange={(e) => onChange({ accountName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="courier">Courier *</Label>
          <Select
            value={form.courier ?? ""}
            onValueChange={(v) => onChange({ courier: v as ShippingAccount["courier"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select courier" />
            </SelectTrigger>
            <SelectContent>
              {COURIER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            placeholder="e.g., 1Z999AA10123456784"
            value={form.accountNumber ?? ""}
            onChange={(e) => onChange({ accountNumber: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingZip">Billing Zip</Label>
        <Input
          id="billingZip"
          placeholder="e.g., 90210"
          value={form.billingZip ?? ""}
          onChange={(e) => onChange({ billingZip: e.target.value })}
          className="max-w-[200px]"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !form.accountName?.trim() || !form.courier || !form.accountNumber?.trim()}
        >
          {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
