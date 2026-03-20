import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import type { OrderModalProps } from "./types";
import { useOrderModal } from "./hooks";

export default function OrderModal(props: OrderModalProps) {
  const { open, onOpenChange } = props;
  const h = useOrderModal(props);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {h.isEditing ? `Edit Project \u2014 ${h.stageLabel} Stage` : "Create New Order"}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <form onSubmit={h.handleSubmit} className="space-y-5">
          {/* SECTION: Core Info (All Stages) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Info</h3>

            {/* Customer & Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer *</Label>
                <Popover open={h.openCustomerCombo} onOpenChange={h.setOpenCustomerCombo}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between mt-1" disabled={h.isLocked}>
                      {h.formData.companyId
                        ? h.companies?.find((c) => c.id === h.formData.companyId)?.name
                        : "Select customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {h.companies?.map((company) => {
                          const count = h.contacts.filter((c: any) => c.companyId === company.id).length;
                          return (
                            <CommandItem key={company.id} value={company.name} onSelect={() => { h.handleFieldChange("companyId", company.id); h.setOpenCustomerCombo(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", h.formData.companyId === company.id ? "opacity-100" : "opacity-0")} />
                              <div className="flex-1">
                                <div>{company.name}</div>
                                <div className="text-xs text-muted-foreground">{count} {count === 1 ? 'contact' : 'contacts'}</div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Contact Person</Label>
                <Select value={h.formData.contactId} onValueChange={(v) => h.handleFieldChange("contactId", v)} disabled={!h.formData.companyId || h.isLocked}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contact..." /></SelectTrigger>
                  <SelectContent>
                    {h.contacts.filter((c: any) => c.companyId === h.formData.companyId).map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}{contact.isPrimary && " (Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Name & Sales Rep */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Name</Label>
                <Input value={h.formData.projectName} onChange={(e) => h.handleFieldChange("projectName", e.target.value)} placeholder="e.g., Annual Company Swag" className="mt-1" disabled={h.isLocked} />
              </div>
              <div>
                <Label>Sales Rep</Label>
                <Select value={h.formData.assignedUserId} onValueChange={(v) => h.handleFieldChange("assignedUserId", v)} disabled={h.isLocked}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select sales rep..." /></SelectTrigger>
                  <SelectContent>
                    {h.users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget & Order Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                  <Input type="number" value={h.formData.budget} onChange={(e) => h.handleFieldChange("budget", e.target.value)} placeholder="0.00" className="pl-7" min="0" step="0.01" disabled={h.isLocked} />
                </div>
              </div>
              <div>
                <Label>Order Type</Label>
                <Select value={h.formData.orderType} onValueChange={(v) => h.handleFieldChange("orderType", v)} disabled={h.isLocked}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="sales_order">Sales Order</SelectItem>
                    <SelectItem value="rush_order">Rush Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer In-Hands Date</Label>
                <Input type="date" value={h.formData.inHandsDate} onChange={(e) => h.handleFieldChange("inHandsDate", e.target.value)} className="mt-1" disabled={h.isLocked} />
              </div>
              <div>
                <Label>Event Date</Label>
                <Input type="date" value={h.formData.eventDate} onChange={(e) => h.handleFieldChange("eventDate", e.target.value)} className="mt-1" disabled={h.isLocked} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Order Description</Label>
              <Textarea value={h.formData.notes} onChange={(e) => h.handleFieldChange("notes", e.target.value)} placeholder="General order information..." rows={2} className="mt-1" disabled={h.isLocked} />
            </div>
          </div>

          {/* SECTION: Quote & SO Fields */}
          {h.showQuoteFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Supplier & Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier In-Hands Date</Label>
                    <Input type="date" value={h.formData.supplierInHandsDate} onChange={(e) => h.handleFieldChange("supplierInHandsDate", e.target.value)} className="mt-1" disabled={h.isLocked} />
                    <p className="text-xs text-gray-400 mt-1">Visible to supplier on POs</p>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox id="isFirm" checked={h.formData.isFirm} onCheckedChange={(checked) => h.handleFieldChange("isFirm", checked)} disabled={h.isLocked} />
                    <Label htmlFor="isFirm" className="text-sm font-normal cursor-pointer">Firm In-Hands Date</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier Notes</Label>
                    <Textarea value={h.formData.supplierNotes} onChange={(e) => h.handleFieldChange("supplierNotes", e.target.value)} placeholder="Notes visible only to suppliers..." rows={2} className="mt-1" disabled={h.isLocked} />
                  </div>
                  <div>
                    <Label>Additional Information</Label>
                    <Textarea value={h.formData.additionalInformation} onChange={(e) => h.handleFieldChange("additionalInformation", e.target.value)} placeholder="Any other relevant details..." rows={2} className="mt-1" disabled={h.isLocked} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION: SO-specific Fields */}
          {h.showSOFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Order Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Terms</Label>
                    <Select value={h.formData.paymentTerms} onValueChange={(v) => h.handleFieldChange("paymentTerms", v)} disabled={h.isLocked}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Customer PO</Label>
                    <Input value={h.formData.customerPo} onChange={(e) => h.handleFieldChange("customerPo", e.target.value)} placeholder="PO number (optional)" className="mt-1" disabled={h.isLocked} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION: Addresses (Quote & SO) */}
          {h.showQuoteFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Addresses</h3>
                  <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => h.setShowMoreSections(!h.showMoreSections)}>
                    {h.showMoreSections ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {h.showMoreSections ? "Collapse" : "Expand"}
                  </Button>
                </div>

                {/* Summary when collapsed */}
                {!h.showMoreSections && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-1">Billing</p>
                      {h.formData.billingStreet ? (
                        <p className="text-gray-700">{h.formData.billingStreet}, {h.formData.billingCity} {h.formData.billingState} {h.formData.billingZipCode}</p>
                      ) : (
                        <p className="text-gray-400 italic">No billing address</p>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-1">Shipping</p>
                      {h.formData.shippingStreet ? (
                        <p className="text-gray-700">{h.formData.shippingStreet}, {h.formData.shippingCity} {h.formData.shippingState} {h.formData.shippingZipCode}</p>
                      ) : (
                        <p className="text-gray-400 italic">No shipping address</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Full address forms when expanded */}
                {h.showMoreSections && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Billing */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold border-b pb-2">Billing Address</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Street</Label>
                          <AddressAutocomplete value={h.formData.billingStreet} onChange={(val) => h.handleFieldChange("billingStreet", val)} onAddressSelect={(addr) => { h.handleFieldChange("billingCity", addr.city); h.handleFieldChange("billingState", addr.state); h.handleFieldChange("billingZipCode", addr.zipCode); h.handleFieldChange("billingCountry", h.normalizeCountryCode(addr.country)); }} placeholder="123 Main St" disabled={h.isLocked} />
                        </div>
                        <div><Label className="text-xs">City</Label><Input value={h.formData.billingCity} onChange={(e) => h.handleFieldChange("billingCity", e.target.value)} disabled={h.isLocked} /></div>
                        <div><Label className="text-xs">State</Label><Input value={h.formData.billingState} onChange={(e) => h.handleFieldChange("billingState", e.target.value)} disabled={h.isLocked} /></div>
                        <div><Label className="text-xs">ZIP</Label><Input value={h.formData.billingZipCode} onChange={(e) => h.handleFieldChange("billingZipCode", e.target.value)} disabled={h.isLocked} /></div>
                        <div>
                          <Label className="text-xs">Country</Label>
                          <Select value={h.formData.billingCountry} onValueChange={(v) => h.handleFieldChange("billingCountry", v)} disabled={h.isLocked}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2"><Label className="text-xs">Phone</Label><Input value={h.formData.billingPhone} onChange={(e) => h.handleFieldChange("billingPhone", e.target.value)} placeholder="(555) 123-4567" disabled={h.isLocked} /></div>
                      </div>
                    </div>

                    {/* Shipping */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="text-sm font-semibold">Shipping Address</h4>
                        <div className="flex items-center gap-2">
                          <Checkbox id="sameAsBilling" checked={h.sameAsBilling} onCheckedChange={(checked) => h.setSameAsBilling(!!checked)} disabled={h.isLocked} />
                          <Label htmlFor="sameAsBilling" className="text-xs font-normal cursor-pointer">Same as Billing</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Street</Label>
                          <AddressAutocomplete value={h.formData.shippingStreet} onChange={(val) => h.handleFieldChange("shippingStreet", val)} onAddressSelect={(addr) => { h.handleFieldChange("shippingCity", addr.city); h.handleFieldChange("shippingState", addr.state); h.handleFieldChange("shippingZipCode", addr.zipCode); h.handleFieldChange("shippingCountry", h.normalizeCountryCode(addr.country)); }} placeholder="123 Main St" disabled={h.sameAsBilling || h.isLocked} />
                        </div>
                        <div><Label className="text-xs">City</Label><Input value={h.formData.shippingCity} onChange={(e) => h.handleFieldChange("shippingCity", e.target.value)} disabled={h.sameAsBilling || h.isLocked} /></div>
                        <div><Label className="text-xs">State</Label><Input value={h.formData.shippingState} onChange={(e) => h.handleFieldChange("shippingState", e.target.value)} disabled={h.sameAsBilling || h.isLocked} /></div>
                        <div><Label className="text-xs">ZIP</Label><Input value={h.formData.shippingZipCode} onChange={(e) => h.handleFieldChange("shippingZipCode", e.target.value)} disabled={h.sameAsBilling || h.isLocked} /></div>
                        <div>
                          <Label className="text-xs">Country</Label>
                          <Select value={h.formData.shippingCountry} onValueChange={(v) => h.handleFieldChange("shippingCountry", v)} disabled={h.sameAsBilling || h.isLocked}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2"><Label className="text-xs">Phone</Label><Input value={h.formData.shippingPhone} onChange={(e) => h.handleFieldChange("shippingPhone", e.target.value)} placeholder="(555) 123-4567" disabled={h.sameAsBilling || h.isLocked} /></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={h.createIsPending || h.updateIsPending || h.isLocked}>
              {h.isEditing
                ? (h.updateIsPending ? "Updating..." : "Update Project")
                : (h.createIsPending ? "Creating..." : "Create Order")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
