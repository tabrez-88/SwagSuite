import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { ArrowLeft, ArrowRight, Check, ChevronsUpDown, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_STAGES } from "@/constants/businessStages";
import type { NewProjectWizardProps } from "./types";
import { WIZARD_STAGES } from "./types";
import { useNewProjectWizard } from "./hooks";

export default function NewProjectWizard(props: NewProjectWizardProps) {
  const { open, onOpenChange } = props;
  const h = useNewProjectWizard(props);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
            "bg-blue-600 text-white"
          )}>1</div>
          <div className={cn("h-0.5 flex-1", h.step >= 2 ? "bg-blue-600" : "bg-gray-200")} />
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
            h.step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          )}>2</div>
        </div>

        {h.step === 1 && (
          <div className="space-y-5">
            {/* Company Selector */}
            <div>
              <Label>Client *</Label>
              <Popover open={h.openCustomerCombo} onOpenChange={h.setOpenCustomerCombo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between mt-1">
                    {h.companyId
                      ? h.companies.find((c) => c.id === h.companyId)?.name
                      : "Select client..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search client..." />
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {h.companies.map((company) => {
                        const count = h.contacts.filter((c: any) => c.companyId === company.id).length;
                        return (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              h.setCompanyId(company.id);
                              h.setOpenCustomerCombo(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", h.companyId === company.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex-1">
                              <div>{company.name}</div>
                              <div className="text-xs text-muted-foreground">{count} {count === 1 ? "contact" : "contacts"}</div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Project Name */}
            <div>
              <Label>Project Name</Label>
              <Input
                value={h.projectName}
                onChange={(e) => h.setProjectName(e.target.value)}
                placeholder="e.g., Annual Company Swag, Q3 Event Giveaways"
                className="mt-1"
              />
            </div>

            {/* Starting Stage Selector */}
            <div>
              <Label>Starting Stage</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {WIZARD_STAGES.map((stage) => {
                  const config = BUSINESS_STAGES[stage.id];
                  const isSelected = h.startingStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => h.setStartingStage(stage.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold",
                        config.color, config.textColor
                      )}>
                        {stage.abbreviation}
                      </div>
                      <span className="text-sm font-medium">{stage.label}</span>
                      <span className="text-[11px] text-gray-400 text-center leading-tight">{stage.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget (Presentation stage) */}
            {h.startingStage === "presentation" && (
              <div>
                <Label>Budget</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={h.budget}
                    onChange={(e) => h.setBudget(e.target.value)}
                    placeholder="Enter budget amount"
                    className="pl-8"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Continue */}
            <div className="flex justify-end pt-2">
              <Button onClick={() => h.setStep(2)} disabled={!h.companyId} className="gap-1.5">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {h.step === 2 && (
          <div className="space-y-5">
            {/* Contact */}
            <div>
              <Label>Client Contact *</Label>
              {!h.showNewContactForm ? (
                <>
                  <Select value={h.contactId} onValueChange={h.setContactId} disabled={!h.companyId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select contact..." />
                    </SelectTrigger>
                    <SelectContent>
                      {h.companyContacts.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && " (Primary)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {h.companyId && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 text-blue-600 p-0 h-auto text-xs"
                      onClick={() => h.setShowNewContactForm(true)}
                    >
                      + Create New Contact
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Contact</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => h.setShowNewContactForm(false)}>Cancel</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">First Name *</Label>
                      <Input value={h.newContactFirstName} onChange={(e) => h.setNewContactFirstName(e.target.value)} placeholder="First name" />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name *</Label>
                      <Input value={h.newContactLastName} onChange={(e) => h.setNewContactLastName(e.target.value)} placeholder="Last name" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={h.newContactEmail} onChange={(e) => h.setNewContactEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={h.newContactPhone} onChange={(e) => h.setNewContactPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input value={h.newContactTitle} onChange={(e) => h.setNewContactTitle(e.target.value)} placeholder="Job title" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!h.newContactFirstName.trim() || !h.newContactLastName.trim() || h.createContactIsPending}
                    onClick={h.handleCreateContact}
                  >
                    {h.createContactIsPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                    Save Contact
                  </Button>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>In-Hands Date</Label>
                <Input type="date" value={h.inHandsDate} onChange={(e) => h.setInHandsDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Event Date</Label>
                <Input type="date" value={h.eventDate} onChange={(e) => h.setEventDate(e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Addresses (Quote & Sales Order) */}
            {h.needsAddresses && (
              <div className="space-y-4">
                {/* Billing */}
                <div>
                  <h3 className="text-sm font-semibold border-b pb-2 mb-3">Billing Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Street</Label>
                      <AddressAutocomplete
                        value={h.billingStreet}
                        onChange={h.setBillingStreet}
                        onAddressSelect={h.handleBillingAddressSelect}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input value={h.billingCity} onChange={(e) => h.setBillingCity(e.target.value)} placeholder="City" />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Input value={h.billingState} onChange={(e) => h.setBillingState(e.target.value)} placeholder="CA" />
                    </div>
                    <div>
                      <Label className="text-xs">ZIP Code</Label>
                      <Input value={h.billingZipCode} onChange={(e) => h.setBillingZipCode(e.target.value)} placeholder="12345" />
                    </div>
                    <div>
                      <Label className="text-xs">Country</Label>
                      <Select value={h.billingCountry} onValueChange={h.setBillingCountry}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h3 className="text-sm font-semibold">Shipping Address</h3>
                    <div className="flex items-center gap-2">
                      <Checkbox id="sameAsBilling" checked={h.sameAsBilling} onCheckedChange={(checked) => h.setSameAsBilling(!!checked)} />
                      <Label htmlFor="sameAsBilling" className="text-xs font-normal cursor-pointer">Same as Billing</Label>
                    </div>
                  </div>
                  {!h.sameAsBilling && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Street</Label>
                        <AddressAutocomplete
                          value={h.shippingStreet}
                          onChange={h.setShippingStreet}
                          onAddressSelect={h.handleShippingAddressSelect}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">City</Label>
                        <Input value={h.shippingCity} onChange={(e) => h.setShippingCity(e.target.value)} placeholder="City" />
                      </div>
                      <div>
                        <Label className="text-xs">State</Label>
                        <Input value={h.shippingState} onChange={(e) => h.setShippingState(e.target.value)} placeholder="CA" />
                      </div>
                      <div>
                        <Label className="text-xs">ZIP Code</Label>
                        <Input value={h.shippingZipCode} onChange={(e) => h.setShippingZipCode(e.target.value)} placeholder="12345" />
                      </div>
                      <div>
                        <Label className="text-xs">Country</Label>
                        <Select value={h.shippingCountry} onValueChange={h.setShippingCountry}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="MX">Mexico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sales Order extras */}
            {h.isSalesOrder && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Terms</Label>
                  <Select value={h.paymentTerms} onValueChange={h.setPaymentTerms}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select payment terms" /></SelectTrigger>
                    <SelectContent>
                      {h.paymentTermsList.map((term) => (
                        <SelectItem key={term.id} value={term.name}>
                          {term.name}
                          {term.isDefault ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer PO</Label>
                  <Input value={h.customerPo} onChange={(e) => h.setCustomerPo(e.target.value)} placeholder="PO number (optional)" className="mt-1" />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => h.setStep(1)} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={h.handleSubmit}
                disabled={h.createIsPending || !h.contactId}
                className="gap-1.5"
              >
                {h.createIsPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Project
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
