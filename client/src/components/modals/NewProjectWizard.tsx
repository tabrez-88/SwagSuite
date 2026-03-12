import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BUSINESS_STAGES, type BusinessStage } from "@/lib/businessStages";
import type { Company } from "@shared/schema";

function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    USA: "US", "U.S.": "US", "U.S.A.": "US",
    "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US",
    CANADA: "CA", CAN: "CA",
    MEXICO: "MX", MEX: "MX", "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

type StartingStage = "presentation" | "quote" | "sales_order";

const WIZARD_STAGES: { id: StartingStage; label: string; abbreviation: string; description: string }[] = [
  { id: "presentation", label: "Presentation", abbreviation: "P", description: "Start with a product presentation for your client" },
  { id: "quote", label: "Quote", abbreviation: "Q", description: "Create a quote with billing & shipping details" },
  { id: "sales_order", label: "Sales Order", abbreviation: "SO", description: "Jump straight to a confirmed sales order" },
];

interface NewProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCompanyId?: string;
}

export default function NewProjectWizard({ open, onOpenChange, initialCompanyId }: NewProjectWizardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Step tracking
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [companyId, setCompanyId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startingStage, setStartingStage] = useState<StartingStage>("presentation");
  const [budget, setBudget] = useState("");
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);

  // Step 2 fields
  const [contactId, setContactId] = useState("");
  const [inHandsDate, setInHandsDate] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Inline contact creation
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactTitle, setNewContactTitle] = useState("");

  // Address fields (quote & sales_order)
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZipCode, setBillingZipCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("US");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZipCode, setShippingZipCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("US");
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Sales order fields
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [customerPo, setCustomerPo] = useState("");

  // Data queries
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: open,
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setCompanyId(initialCompanyId || "");
      setProjectName("");
      setStartingStage("presentation");
      setBudget("");
      setOpenCustomerCombo(false);
      setContactId("");
      setInHandsDate("");
      setEventDate("");
      setShowNewContactForm(false);
      setNewContactFirstName("");
      setNewContactLastName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setNewContactTitle("");
      setBillingStreet("");
      setBillingCity("");
      setBillingState("");
      setBillingZipCode("");
      setBillingCountry("US");
      setShippingStreet("");
      setShippingCity("");
      setShippingState("");
      setShippingZipCode("");
      setShippingCountry("US");
      setSameAsBilling(false);
      setPaymentTerms("Net 30");
      setCustomerPo("");
    }
  }, [open, initialCompanyId]);

  // Auto-select primary contact when company changes
  useEffect(() => {
    if (companyId && contacts.length > 0) {
      const companyContacts = contacts.filter((c: any) => c.companyId === companyId);
      const primary = companyContacts.find((c: any) => c.isPrimary);
      setContactId(primary?.id || companyContacts[0]?.id || "");
    } else {
      setContactId("");
    }
  }, [companyId, contacts]);

  // Auto-populate addresses from selected contact (or company fallback)
  useEffect(() => {
    if (!contactId || startingStage === "presentation") return;
    const contact = contacts.find((c: any) => c.id === contactId);
    if (!contact) return;

    // Try billing address from contact
    if (contact.billingAddress) {
      try {
        const addr = JSON.parse(contact.billingAddress);
        if (addr.street) setBillingStreet(addr.street);
        if (addr.city) setBillingCity(addr.city);
        if (addr.state) setBillingState(addr.state);
        if (addr.zipCode) setBillingZipCode(addr.zipCode);
        if (addr.country) setBillingCountry(normalizeCountryCode(addr.country));
      } catch { /* non-JSON, skip */ }
    }

    // Try shipping address from contact
    if (contact.shippingAddress) {
      try {
        const addr = JSON.parse(contact.shippingAddress);
        if (addr.street) setShippingStreet(addr.street);
        if (addr.city) setShippingCity(addr.city);
        if (addr.state) setShippingState(addr.state);
        if (addr.zipCode) setShippingZipCode(addr.zipCode);
        if (addr.country) setShippingCountry(normalizeCountryCode(addr.country));
      } catch { /* non-JSON, skip */ }
    }

    // Fallback: if no contact addresses, try company address
    if (!contact.billingAddress && !contact.shippingAddress) {
      const company = companies.find((c) => c.id === companyId);
      if (company?.address || company?.city) {
        setBillingStreet(company.address || "");
        setBillingCity(company.city || "");
        setBillingState(company.state || "");
        setBillingZipCode(company.zipCode || "");
        if (company.country) setBillingCountry(normalizeCountryCode(company.country));
      }
    }
  }, [contactId, contacts, companies, companyId, startingStage]);

  // Sync shipping with billing
  useEffect(() => {
    if (sameAsBilling) {
      setShippingStreet(billingStreet);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingZipCode(billingZipCode);
      setShippingCountry(billingCountry);
    }
  }, [sameAsBilling, billingStreet, billingCity, billingState, billingZipCode, billingCountry]);

  const companyContacts = contacts.filter((c: any) => c.companyId === companyId);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/orders", payload);
      return res.json();
    },
    onSuccess: (newOrder) => {
      toast({ title: "Project created", description: `Project #${newOrder.orderNumber} has been created.` });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onOpenChange(false);
      if (newOrder.id) {
        setLocation(`/project/${newOrder.id}`);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/contacts", payload);
      return res.json();
    },
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setContactId(newContact.id);
      setShowNewContactForm(false);
      setNewContactFirstName("");
      setNewContactLastName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setNewContactTitle("");
      toast({ title: "Contact created", description: `${newContact.firstName} ${newContact.lastName} has been added.` });
    },
    onError: () => {
      toast({ title: "Failed to create contact", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const payload: any = {
      companyId,
      projectName: projectName || undefined,
      contactId: contactId || undefined,
      stageData: { startingStage },
    };

    if (inHandsDate) payload.inHandsDate = new Date(inHandsDate);
    if (eventDate) payload.eventDate = new Date(eventDate);
    if (budget) payload.budget = budget;

    if (startingStage === "sales_order") {
      payload.orderType = "sales_order";
      payload.salesOrderStatus = "new";
      payload.paymentTerms = paymentTerms;
      if (customerPo) payload.customerPo = customerPo;
    }

    // Address serialization for quote & sales_order
    if (startingStage !== "presentation") {
      if (billingStreet || billingCity) {
        payload.billingAddress = JSON.stringify({
          street: billingStreet,
          city: billingCity,
          state: billingState,
          zipCode: billingZipCode,
          country: billingCountry,
        });
      }
      const shipStreet = sameAsBilling ? billingStreet : shippingStreet;
      const shipCity = sameAsBilling ? billingCity : shippingCity;
      const shipState = sameAsBilling ? billingState : shippingState;
      const shipZip = sameAsBilling ? billingZipCode : shippingZipCode;
      const shipCountry = sameAsBilling ? billingCountry : shippingCountry;
      if (shipStreet || shipCity) {
        payload.shippingAddress = JSON.stringify({
          street: shipStreet,
          city: shipCity,
          state: shipState,
          zipCode: shipZip,
          country: shipCountry,
        });
      }
    }

    createMutation.mutate(payload);
  };

  const needsAddresses = startingStage !== "presentation";
  const isSalesOrder = startingStage === "sales_order";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
            "bg-blue-600 text-white"
          )}>1</div>
          <div className={cn("h-0.5 flex-1", step >= 2 ? "bg-blue-600" : "bg-gray-200")} />
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
            step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          )}>2</div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            {/* Company Selector */}
            <div>
              <Label>Client *</Label>
              <Popover open={openCustomerCombo} onOpenChange={setOpenCustomerCombo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between mt-1">
                    {companyId
                      ? companies.find((c) => c.id === companyId)?.name
                      : "Select client..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search client..." />
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {companies.map((company) => {
                        const count = contacts.filter((c: any) => c.companyId === company.id).length;
                        return (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setCompanyId(company.id);
                              setOpenCustomerCombo(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", companyId === company.id ? "opacity-100" : "opacity-0")} />
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
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
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
                  const isSelected = startingStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setStartingStage(stage.id)}
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
            {startingStage === "presentation" && (
              <div>
                <Label>Budget</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
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
              <Button onClick={() => setStep(2)} disabled={!companyId} className="gap-1.5">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Contact */}
            <div>
              <Label>Client Contact *</Label>
              {!showNewContactForm ? (
                <>
                  <Select value={contactId} onValueChange={setContactId} disabled={!companyId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select contact..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companyContacts.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && " (Primary)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companyId && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 text-blue-600 p-0 h-auto text-xs"
                      onClick={() => setShowNewContactForm(true)}
                    >
                      + Create New Contact
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Contact</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowNewContactForm(false)}>Cancel</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">First Name *</Label>
                      <Input value={newContactFirstName} onChange={(e) => setNewContactFirstName(e.target.value)} placeholder="First name" />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name *</Label>
                      <Input value={newContactLastName} onChange={(e) => setNewContactLastName(e.target.value)} placeholder="Last name" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input value={newContactTitle} onChange={(e) => setNewContactTitle(e.target.value)} placeholder="Job title" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!newContactFirstName.trim() || !newContactLastName.trim() || createContactMutation.isPending}
                    onClick={() => createContactMutation.mutate({
                      companyId,
                      firstName: newContactFirstName.trim(),
                      lastName: newContactLastName.trim(),
                      email: newContactEmail || undefined,
                      phone: newContactPhone || undefined,
                      title: newContactTitle || undefined,
                    })}
                  >
                    {createContactMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                    Save Contact
                  </Button>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>In-Hands Date</Label>
                <Input type="date" value={inHandsDate} onChange={(e) => setInHandsDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Event Date</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Addresses (Quote & Sales Order) */}
            {needsAddresses && (
              <div className="space-y-4">
                {/* Billing */}
                <div>
                  <h3 className="text-sm font-semibold border-b pb-2 mb-3">Billing Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Street</Label>
                      <AddressAutocomplete
                        value={billingStreet}
                        onChange={setBillingStreet}
                        onAddressSelect={(addr) => {
                          setBillingCity(addr.city);
                          setBillingState(addr.state);
                          setBillingZipCode(addr.zipCode);
                          setBillingCountry(normalizeCountryCode(addr.country));
                        }}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder="City" />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Input value={billingState} onChange={(e) => setBillingState(e.target.value)} placeholder="CA" />
                    </div>
                    <div>
                      <Label className="text-xs">ZIP Code</Label>
                      <Input value={billingZipCode} onChange={(e) => setBillingZipCode(e.target.value)} placeholder="12345" />
                    </div>
                    <div>
                      <Label className="text-xs">Country</Label>
                      <Select value={billingCountry} onValueChange={setBillingCountry}>
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
                      <Checkbox id="sameAsBilling" checked={sameAsBilling} onCheckedChange={(checked) => setSameAsBilling(!!checked)} />
                      <Label htmlFor="sameAsBilling" className="text-xs font-normal cursor-pointer">Same as Billing</Label>
                    </div>
                  </div>
                  {!sameAsBilling && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Street</Label>
                        <AddressAutocomplete
                          value={shippingStreet}
                          onChange={setShippingStreet}
                          onAddressSelect={(addr) => {
                            setShippingCity(addr.city);
                            setShippingState(addr.state);
                            setShippingZipCode(addr.zipCode);
                            setShippingCountry(normalizeCountryCode(addr.country));
                          }}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">City</Label>
                        <Input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="City" />
                      </div>
                      <div>
                        <Label className="text-xs">State</Label>
                        <Input value={shippingState} onChange={(e) => setShippingState(e.target.value)} placeholder="CA" />
                      </div>
                      <div>
                        <Label className="text-xs">ZIP Code</Label>
                        <Input value={shippingZipCode} onChange={(e) => setShippingZipCode(e.target.value)} placeholder="12345" />
                      </div>
                      <div>
                        <Label className="text-xs">Country</Label>
                        <Select value={shippingCountry} onValueChange={setShippingCountry}>
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
            {isSalesOrder && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
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
                  <Input value={customerPo} onChange={(e) => setCustomerPo(e.target.value)} placeholder="PO number (optional)" className="mt-1" />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !contactId}
                className="gap-1.5"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
