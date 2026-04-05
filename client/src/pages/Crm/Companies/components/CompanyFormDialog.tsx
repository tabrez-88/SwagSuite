import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

import { companyFormSchema, type CompanyFormData } from "@/schemas/crm.schemas";
import type { Company } from "@/services/companies/types";
import { INDUSTRY_OPTIONS } from "../CompanyDetail/types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSubmit: (data: CompanyFormData) => void;
  isPending: boolean;
  customFields: Record<string, string>;
  onCustomFieldsChange: (fields: Record<string, string>) => void;
  // Optional props for detail page context (tax codes, payment terms)
  taxCodes?: Array<{ id: number | string; label: string; rate?: number }>;
  paymentTermsOptions?: Array<{ id: string; name: string }>;
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  isPending,
  customFields,
  onCustomFieldsChange,
  taxCodes,
  paymentTermsOptions,
}: CompanyFormDialogProps) {
  const isEdit = !!company;

  const [newCustomFieldKey, setNewCustomFieldKey] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      website: "",
      accountNumber: "",
      defaultTerms: "",
      taxExempt: false,
      defaultTaxCodeId: "",
      linkedinUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      otherSocialUrl: "",
      notes: "",
    },
  });

  // Reset form when dialog opens or company changes
  useEffect(() => {
    if (open) {
      if (company) {
        form.reset({
          name: company.name || "",
          industry: company.industry || "",
          website: company.website || "",
          accountNumber: (company as any).accountNumber || "",
          defaultTerms: (company as any).defaultTerms || "",
          taxExempt: (company as any).taxExempt || false,
          defaultTaxCodeId: (company as any).defaultTaxCodeId || "",
          linkedinUrl: company.socialMediaLinks?.linkedin || "",
          twitterUrl: company.socialMediaLinks?.twitter || "",
          facebookUrl: company.socialMediaLinks?.facebook || "",
          instagramUrl: company.socialMediaLinks?.instagram || "",
          otherSocialUrl: company.socialMediaLinks?.other || "",
          notes: company.notes || "",
        });
        onCustomFieldsChange(company.customFields || {});
      } else {
        form.reset({
          name: "",
          industry: "",
          website: "",
          accountNumber: "",
          defaultTerms: "",
          taxExempt: false,
          defaultTaxCodeId: "",
          linkedinUrl: "",
          twitterUrl: "",
          facebookUrl: "",
          instagramUrl: "",
          otherSocialUrl: "",
          notes: "",
        });
        onCustomFieldsChange({});
      }
      setNewCustomFieldKey("");
      setNewCustomFieldValue("");
    }
  }, [open, company]);

  const handleAddCustomField = () => {
    const key = newCustomFieldKey.trim();
    const value = newCustomFieldValue.trim();
    if (!key) return;
    onCustomFieldsChange({ ...customFields, [key]: value });
    setNewCustomFieldKey("");
    setNewCustomFieldValue("");
  };

  const handleRemoveCustomField = (key: string) => {
    const updated = { ...customFields };
    delete updated[key];
    onCustomFieldsChange(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the company information in your CRM system."
              : "Create a new company record in your CRM system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="ACME Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ACC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentTermsOptions && (
                <FormField
                  control={form.control}
                  name="defaultTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Payment Terms</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select terms" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not Set</SelectItem>
                          {paymentTermsOptions.map((term) => (
                            <SelectItem key={term.id} value={term.name}>
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Contacts & Addresses:</strong>{" "}
                {isEdit
                  ? "Use the Contacts tab and the Addresses tab to manage contacts and addresses."
                  : "After creating the company, you can manage contacts and addresses through the company detail page."}
              </p>
            </div>

            {/* Social Media Links */}
            <div className="space-y-3">
              <h4 className="font-medium">Social Media Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/company/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facebookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="otherSocialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Social Media</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tax Settings - only shown when taxCodes are provided */}
            {taxCodes && (
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium">Tax Settings</h4>
                <FormField
                  control={form.control}
                  name="taxExempt"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Tax Exempt</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultTaxCodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Tax Code</FormLabel>
                      <Select
                        value={field.value || "none"}
                        onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default tax code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not Set</SelectItem>
                          {taxCodes.map((tc) => (
                            <SelectItem key={tc.id} value={String(tc.id)}>
                              {tc.label} {tc.rate ? `(${tc.rate}%)` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Custom Fields */}
            <div className="space-y-3">
              <h4 className="font-medium">Custom Fields</h4>
              {Object.keys(customFields).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input value={key} disabled className="flex-1 bg-muted" />
                      <Input
                        value={value}
                        className="flex-1"
                        onChange={(e) =>
                          onCustomFieldsChange({ ...customFields, [key]: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => handleRemoveCustomField(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Field Name</label>
                  <Input
                    placeholder="e.g., Account Manager"
                    value={newCustomFieldKey}
                    onChange={(e) => setNewCustomFieldKey(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Value</label>
                  <Input
                    placeholder="e.g., John Smith"
                    value={newCustomFieldValue}
                    onChange={(e) => setNewCustomFieldValue(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={!newCustomFieldKey.trim()}
                  onClick={handleAddCustomField}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {Object.keys(customFields).length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No custom fields. Add key-value pairs above.
                </p>
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
                      placeholder="Additional notes about the company..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-swag-primary hover:bg-swag-primary/90"
              >
                {isPending
                  ? isEdit ? "Updating..." : "Creating..."
                  : isEdit ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
