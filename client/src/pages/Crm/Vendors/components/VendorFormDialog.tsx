import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import { vendorFormSchema, type VendorFormData } from "@/schemas/crm.schemas";
import type { Vendor } from "@/services/suppliers/types";
import { usePaymentTerms } from "@/services/payment-terms";

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSubmit: (data: VendorFormData) => void;
  isPending: boolean;
}

const defaultValues: VendorFormData = {
  name: "",
  email: "",
  phone: "",
  website: "",
  contactPerson: "",
  paymentTerms: "",
  defaultTerms: "",
  accountNumber: "",
  notes: "",
  isPreferred: false,
  isDecorator: false,
  doNotOrder: false,
  eqpPricing: undefined,
  rebatePercentage: undefined,
  freeSetups: false,
  freeSpecSamples: false,
  freeSelfPromo: false,
  reducedSpecSamples: false,
};

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
  onSubmit,
  isPending,
}: VendorFormDialogProps) {
  const { data: paymentTermsOptions = [] } = usePaymentTerms();
  const isEdit = !!vendor;

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues,
  });

  const isPreferred = form.watch("isPreferred");

  useEffect(() => {
    if (!open) return;

    if (vendor) {
      form.reset({
        name: vendor.name ?? "",
        email: vendor.email ?? "",
        phone: vendor.phone ?? "",
        website: vendor.website ?? "",
        contactPerson: vendor.contactPerson ?? "",
        paymentTerms: vendor.paymentTerms ?? "",
        defaultTerms: vendor.defaultTerms ?? "",
        accountNumber: vendor.accountNumber ?? "",
        notes: vendor.notes ?? "",
        isPreferred: vendor.isPreferred ?? false,
        isDecorator: vendor.isDecorator ?? false,
        doNotOrder: vendor.doNotOrder ?? false,
        eqpPricing: vendor.preferredBenefits?.eqpPricing ?? undefined,
        rebatePercentage: vendor.preferredBenefits?.rebatePercentage ?? undefined,
        freeSetups: vendor.preferredBenefits?.freeSetups ?? false,
        freeSpecSamples: vendor.preferredBenefits?.freeSpecSamples ?? false,
        freeSelfPromo: vendor.preferredBenefits?.freeSelfPromo ?? false,
        reducedSpecSamples: vendor.preferredBenefits?.reducedSpecSamples ?? false,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, vendor, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Vendor" : "Add New Vendor"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Vendor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info banner */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Contact Management: After creating the vendor, you can add
              contacts through the vendor details page.
            </div>

            {/* Payment Terms */}
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) =>
                      field.onChange(val === "__none__" ? "" : val)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Not Set</SelectItem>
                      {paymentTermsOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Decorator Toggle */}
            <FormField
              control={form.control}
              name="isDecorator"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-3">
                  <div>
                    <FormLabel className="mb-0 font-medium text-purple-800">Decorator</FormLabel>
                    <p className="text-xs text-purple-600">This vendor provides decoration/imprint services</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Preferred Vendor Settings */}
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 space-y-4">
              <div className="flex items-center gap-2 font-medium text-yellow-800">
                <Star className="h-4 w-4" />
                Preferred Vendor Settings
              </div>

              <FormField
                control={form.control}
                name="isPreferred"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="mb-0">Preferred Vendor</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isPreferred && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    {/* EQP Pricing */}
                    <FormField
                      control={form.control}
                      name="eqpPricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EQP Pricing (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rebate Percentage */}
                    <FormField
                      control={form.control}
                      name="rebatePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rebate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="freeSetups"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="mb-0 font-normal">
                            Free Setups
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freeSpecSamples"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="mb-0 font-normal">
                            Free Spec Samples
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freeSelfPromo"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="mb-0 font-normal">
                            Free Self Promo
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reducedSpecSamples"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="mb-0 font-normal">
                            Reduced Spec Samples
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this vendor..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isEdit
                  ? isPending
                    ? "Updating..."
                    : "Update Vendor"
                  : isPending
                    ? "Creating..."
                    : "Create Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
