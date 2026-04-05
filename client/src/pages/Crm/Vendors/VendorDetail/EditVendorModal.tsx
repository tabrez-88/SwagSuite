import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorFormSchema, type VendorFormData } from "@/schemas/crm.schemas";
import { useUpdateVendor } from "@/services/suppliers";
import { usePaymentTerms } from "@/services/payment-terms";
import type { Vendor } from "@/services/suppliers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Gift, Phone, Star, Trash2 } from "lucide-react";

interface EditVendorModalProps {
  vendor: Vendor;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function EditVendorModal({ vendor, isOpen, setIsOpen }: EditVendorModalProps) {
  const updateMutation = useUpdateVendor();
  const { data: paymentTermsOptions = [] } = usePaymentTerms();

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
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
      doNotOrder: false,
      eqpPricing: undefined,
      rebatePercentage: undefined,
      freeSetups: false,
      freeSpecSamples: false,
      freeSelfPromo: false,
      reducedSpecSamples: false,
    },
  });

  useEffect(() => {
    if (isOpen && vendor) {
      form.reset({
        name: vendor.name || "",
        email: "",
        phone: "",
        website: vendor.website || "",
        contactPerson: "",
        paymentTerms: vendor.paymentTerms || "",
        defaultTerms: vendor.defaultTerms || "",
        accountNumber: vendor.accountNumber || "",
        notes: vendor.notes || "",
        isPreferred: vendor.isPreferred || false,
        doNotOrder: vendor.doNotOrder || false,
        eqpPricing: vendor.preferredBenefits?.eqpPricing || undefined,
        rebatePercentage: vendor.preferredBenefits?.rebatePercentage || undefined,
        freeSetups: vendor.preferredBenefits?.freeSetups || false,
        freeSpecSamples: vendor.preferredBenefits?.freeSpecSamples || false,
        freeSelfPromo: vendor.preferredBenefits?.freeSelfPromo || false,
        reducedSpecSamples: vendor.preferredBenefits?.reducedSpecSamples || false,
      });
    }
  }, [isOpen, vendor]);

  const handleSubmit = (data: VendorFormData) => {
    updateMutation.mutate(
      { id: vendor.id, data },
      { onSuccess: () => setIsOpen(false) },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor — {vendor.name}</DialogTitle>
          <DialogDescription>Update vendor information.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name *</FormLabel>
                  <FormControl><Input placeholder="Enter vendor name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl><Input placeholder="https://vendor.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Business Terms */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Business Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Payment Terms</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {paymentTermsOptions.map((term) => (
                          <SelectItem key={term.id} value={term.name}>{term.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl><Input placeholder="e.g., ACC-001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Vendor Status */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />
                Vendor Status
              </h3>
              <FormField control={form.control} name="isPreferred" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                  <div>
                    <FormLabel className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      Preferred Vendor
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">Mark for priority treatment</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="doNotOrder" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                  <div>
                    <FormLabel className="flex items-center gap-2 text-red-700">
                      <Trash2 className="h-4 w-4" />
                      Do Not Order
                    </FormLabel>
                    <p className="text-sm text-red-600">Block orders — requires admin approval</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* Preferred Benefits */}
            {form.watch("isPreferred") && (
              <div className="space-y-4 pt-4 border-t bg-yellow-50/50 p-4 rounded-lg">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4 text-yellow-600" />
                  Preferred Benefits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="eqpPricing" render={({ field }) => (
                    <FormItem>
                      <FormLabel>EQP Pricing (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 15" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="rebatePercentage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rebate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["freeSetups", "freeSpecSamples", "reducedSpecSamples", "freeSelfPromo"] as const).map((fieldName) => (
                    <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <FormLabel className="capitalize">{fieldName.replace(/([A-Z])/g, " $1").trim()}</FormLabel>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea placeholder="Additional notes..." rows={4} {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
