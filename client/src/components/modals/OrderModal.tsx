import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import * as React from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Company, Order } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import type { BusinessStage } from "@/constants/businessStages";

// Normalize various country name/code formats to standard 2-letter codes
function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    "USA": "US",
    "U.S.": "US",
    "U.S.A.": "US",
    "UNITED STATES": "US",
    "UNITED STATES OF AMERICA": "US",
    "CANADA": "CA",
    "CAN": "CA",
    "MEXICO": "MX",
    "MEX": "MX",
    "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  initialCompanyId?: string;
  businessStageId?: BusinessStage;
}

export default function OrderModal({ open, onOpenChange, order, initialCompanyId, businessStageId }: OrderModalProps) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    companyId: "",
    contactId: "",
    assignedUserId: "",
    orderType: "quote",
    projectName: "",
    budget: "",
    inHandsDate: "",
    eventDate: "",
    supplierInHandsDate: "",
    isFirm: false,
    notes: "",
    supplierNotes: "",
    additionalInformation: "",
    orderDiscount: "0",
    paymentTerms: "Net 30",
    customerPo: "",
    billingContact: "",
    billingEmail: "",
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "US",
    billingPhone: "",
    shippingContact: "",
    shippingEmail: "",
    shippingStreet: "",
    shippingCity: "",
    shippingState: "",
    shippingZipCode: "",
    shippingCountry: "US",
    shippingPhone: "",
  });
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [showMoreSections, setShowMoreSections] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditing = !!order;
  const stage = businessStageId || "presentation";

  // Stage visibility helpers
  const showPresentation = true; // always show core fields
  const showQuoteFields = stage === "quote" || stage === "sales_order" || stage === "invoice";
  const showSOFields = stage === "sales_order" || stage === "invoice";
  const isLocked = stage === "invoice"; // invoice stage = mostly read-only

  // Fetch current user first so it's available for form initialization
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    enabled: open,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: open,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users/team"],
    enabled: open,
  });

  // Reset or populate form when opening
  useEffect(() => {
    if (open) {
      if (order) {
        // Parse shipping address if it's JSON
        let shippingStreet = "", shippingCity = "", shippingState = "", shippingZipCode = "", shippingCountry = "US", shippingPhone = "", shippingContact = "", shippingEmail = "";
        if ((order as any).shippingAddress) {
          try {
            const parsed = JSON.parse((order as any).shippingAddress);
            if (parsed.street) {
              shippingStreet = parsed.street || "";
              shippingCity = parsed.city || "";
              shippingState = parsed.state || "";
              shippingZipCode = parsed.zipCode || "";
              shippingCountry = normalizeCountryCode(parsed.country || "US");
              shippingPhone = parsed.phone || "";
              shippingContact = parsed.contactName || "";
              shippingEmail = parsed.email || "";
            } else {
              shippingStreet = parsed.address || "";
            }
          } catch {
            shippingStreet = (order as any).shippingAddress;
          }
        }

        // Parse billing address if it's JSON
        let billingStreet = "", billingCity = "", billingState = "", billingZipCode = "", billingCountry = "US", billingPhone = "", billingContact = "", billingEmail = "";
        if ((order as any).billingAddress) {
          try {
            const parsed = JSON.parse((order as any).billingAddress);
            if (parsed.street) {
              billingStreet = parsed.street || "";
              billingCity = parsed.city || "";
              billingState = parsed.state || "";
              billingZipCode = parsed.zipCode || "";
              billingCountry = normalizeCountryCode(parsed.country || "US");
              billingPhone = parsed.phone || "";
              billingContact = parsed.contactName || "";
              billingEmail = parsed.email || "";
            } else {
              billingStreet = parsed.address || "";
            }
          } catch {
            billingStreet = (order as any).billingAddress;
          }
        }

        setFormData({
          companyId: order.companyId || "",
          contactId: (order as any).contactId || "",
          assignedUserId: (order as any).assignedUserId || "",
          orderType: order.orderType || "quote",
          projectName: order.projectName || "",
          budget: order.budget || "",
          inHandsDate: order.inHandsDate ? new Date(order.inHandsDate).toISOString().split('T')[0] : "",
          eventDate: order.eventDate ? new Date(order.eventDate).toISOString().split('T')[0] : "",
          supplierInHandsDate: (order as any).supplierInHandsDate ? new Date((order as any).supplierInHandsDate).toISOString().split('T')[0] : "",
          isFirm: (order as any).isFirm || false,
          notes: order.notes || "",
          supplierNotes: (order as any).supplierNotes || "",
          additionalInformation: (order as any).additionalInformation || "",
          orderDiscount: (order as any).orderDiscount || "0",
          paymentTerms: (order as any).paymentTerms || "Net 30",
          customerPo: (order as any).customerPo || "",
          billingContact, billingEmail, billingStreet, billingCity, billingState, billingZipCode, billingCountry, billingPhone,
          shippingContact, shippingEmail, shippingStreet, shippingCity, shippingState, shippingZipCode, shippingCountry, shippingPhone,
        });
      } else {
        setFormData({
          companyId: initialCompanyId || "",
          contactId: "",
          assignedUserId: currentUser?.id || "",
          orderType: "quote",
          projectName: "",
          budget: "",
          inHandsDate: "",
          eventDate: "",
          supplierInHandsDate: "",
          isFirm: false,
          notes: "",
          supplierNotes: "",
          additionalInformation: "",
          orderDiscount: "0",
          paymentTerms: "Net 30",
          customerPo: "",
          billingContact: "", billingEmail: "", billingStreet: "", billingCity: "", billingState: "", billingZipCode: "", billingCountry: "US", billingPhone: "",
          shippingContact: "", shippingEmail: "", shippingStreet: "", shippingCity: "", shippingState: "", shippingZipCode: "", shippingCountry: "US", shippingPhone: "",
        });
      }
      setShowMoreSections(false);
    }
  }, [open, order, initialCompanyId, currentUser]);

  // Auto-select contact when editing and contacts load
  useEffect(() => {
    if (open && order && contacts.length > 0 && !formData.contactId) {
      const companyContacts = contacts.filter((c: any) => c.companyId === order.companyId);
      const primaryContact = companyContacts.find((c: any) => c.isPrimary);
      const orderContactId = (order as any).contactId || primaryContact?.id || "";
      if (orderContactId) {
        setFormData((prev) => ({ ...prev, contactId: orderContactId }));
      }
    }
  }, [open, order, contacts, formData.contactId]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Sync shipping address with billing when checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      setFormData((prev) => ({
        ...prev,
        shippingContact: prev.billingContact,
        shippingEmail: prev.billingEmail,
        shippingStreet: prev.billingStreet,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingZipCode: prev.billingZipCode,
        shippingCountry: prev.billingCountry,
        shippingPhone: prev.billingPhone,
      }));
    }
  }, [sameAsBilling, formData.billingContact, formData.billingEmail, formData.billingStreet, formData.billingCity, formData.billingState, formData.billingZipCode, formData.billingCountry, formData.billingPhone]);

  // Auto-fill billing and shipping address when contact is selected
  useEffect(() => {
    if (formData.contactId && contacts.length > 0) {
      const selectedContact = contacts.find((c: any) => c.id === formData.contactId);
      if (selectedContact) {
        const contactFullName = `${selectedContact.firstName} ${selectedContact.lastName}`;
        const contactEmail = selectedContact.email || "";

        if (selectedContact.billingAddress) {
          try {
            const billingAddr = JSON.parse(selectedContact.billingAddress);
            setFormData((prev) => ({
              ...prev,
              billingContact: contactFullName, billingEmail: contactEmail,
              billingStreet: billingAddr.street || "", billingCity: billingAddr.city || "",
              billingState: billingAddr.state || "", billingZipCode: billingAddr.zipCode || "",
              billingCountry: normalizeCountryCode(billingAddr.country || "US"),
              billingPhone: selectedContact.phone || "",
            }));
          } catch {
            setFormData((prev) => ({ ...prev, billingContact: contactFullName, billingEmail: contactEmail, billingPhone: selectedContact.phone || "" }));
          }
        } else {
          setFormData((prev) => ({ ...prev, billingContact: contactFullName, billingEmail: contactEmail, billingPhone: selectedContact.phone || "" }));
        }

        if (selectedContact.shippingAddress) {
          try {
            const shippingAddr = JSON.parse(selectedContact.shippingAddress);
            setFormData((prev) => ({
              ...prev,
              shippingContact: contactFullName, shippingEmail: contactEmail,
              shippingStreet: shippingAddr.street || "", shippingCity: shippingAddr.city || "",
              shippingState: shippingAddr.state || "", shippingZipCode: shippingAddr.zipCode || "",
              shippingCountry: normalizeCountryCode(shippingAddr.country || "US"),
              shippingPhone: shippingAddr.phone || "",
            }));
          } catch {
            setFormData((prev) => ({ ...prev, shippingContact: contactFullName, shippingEmail: contactEmail }));
          }
        } else {
          setFormData((prev) => ({ ...prev, shippingContact: contactFullName, shippingEmail: contactEmail }));
        }
      }
    }
  }, [formData.contactId, contacts]);

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = { ...data };
      if (payload.inHandsDate) payload.inHandsDate = new Date(payload.inHandsDate);
      else if (payload.inHandsDate === "") payload.inHandsDate = null;
      if (payload.eventDate) payload.eventDate = new Date(payload.eventDate);
      else if (payload.eventDate === "") payload.eventDate = null;
      if (payload.supplierInHandsDate) payload.supplierInHandsDate = new Date(payload.supplierInHandsDate);
      else if (payload.supplierInHandsDate === "") payload.supplierInHandsDate = null;
      payload.isFirm = payload.isFirm || false;
      const response = await apiRequest("PATCH", `/api/orders/${order?.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order?.id}`] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (newOrder) => {
      toast({ title: "Order created" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onOpenChange(false);
      if (newOrder.id) setLocation(`/project/${newOrder.id}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Failed to create order", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    const payload: any = { ...formData };

    // Convert dates
    payload.inHandsDate = formData.inHandsDate ? new Date(formData.inHandsDate) : null;
    payload.eventDate = formData.eventDate ? new Date(formData.eventDate) : null;
    payload.supplierInHandsDate = formData.supplierInHandsDate ? new Date(formData.supplierInHandsDate) : null;
    payload.isFirm = formData.isFirm;
    payload.projectName = formData.projectName || undefined;
    payload.budget = formData.budget || undefined;
    payload.paymentTerms = formData.paymentTerms || undefined;
    payload.customerPo = formData.customerPo || undefined;

    // Build address JSON
    const hasBillingData = formData.billingStreet || formData.billingCity || formData.billingPhone || formData.billingContact || formData.billingEmail;
    if (hasBillingData) {
      payload.billingAddress = JSON.stringify({
        street: formData.billingStreet, city: formData.billingCity, state: formData.billingState,
        zipCode: formData.billingZipCode, country: formData.billingCountry, phone: formData.billingPhone,
        contactName: formData.billingContact, email: formData.billingEmail,
      });
    }
    const hasShippingData = formData.shippingStreet || formData.shippingCity || formData.shippingPhone || formData.shippingContact || formData.shippingEmail;
    if (hasShippingData) {
      payload.shippingAddress = JSON.stringify({
        street: formData.shippingStreet, city: formData.shippingCity, state: formData.shippingState,
        zipCode: formData.shippingZipCode, country: formData.shippingCountry, phone: formData.shippingPhone,
        contactName: formData.shippingContact, email: formData.shippingEmail,
      });
    }

    // Clean up individual address fields
    const addressFields = ["billingContact", "billingEmail", "billingStreet", "billingCity", "billingState", "billingZipCode", "billingCountry", "billingPhone", "shippingContact", "shippingEmail", "shippingStreet", "shippingCity", "shippingState", "shippingZipCode", "shippingCountry", "shippingPhone"];
    addressFields.forEach((f) => delete payload[f]);

    if (order) {
      updateOrderMutation.mutate(payload);
    } else {
      createOrderMutation.mutate(payload);
    }
  };

  const stageLabel = stage === "presentation" ? "Presentation" : stage === "quote" ? "Quote" : stage === "sales_order" ? "Sales Order" : "Invoice";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Project — ${stageLabel} Stage` : "Create New Order"}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ===== SECTION: Core Info (All Stages) ===== */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Info</h3>

            {/* Customer & Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer *</Label>
                <Popover open={openCustomerCombo} onOpenChange={setOpenCustomerCombo}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between mt-1" disabled={isLocked}>
                      {formData.companyId
                        ? companies?.find((c) => c.id === formData.companyId)?.name
                        : "Select customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {companies?.map((company) => {
                          const count = contacts.filter((c: any) => c.companyId === company.id).length;
                          return (
                            <CommandItem key={company.id} value={company.name} onSelect={() => { handleFieldChange("companyId", company.id); setOpenCustomerCombo(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.companyId === company.id ? "opacity-100" : "opacity-0")} />
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
                <Select value={formData.contactId} onValueChange={(v) => handleFieldChange("contactId", v)} disabled={!formData.companyId || isLocked}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contact..." /></SelectTrigger>
                  <SelectContent>
                    {contacts.filter((c: any) => c.companyId === formData.companyId).map((contact: any) => (
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
                <Input value={formData.projectName} onChange={(e) => handleFieldChange("projectName", e.target.value)} placeholder="e.g., Annual Company Swag" className="mt-1" disabled={isLocked} />
              </div>
              <div>
                <Label>Sales Rep</Label>
                <Select value={formData.assignedUserId} onValueChange={(v) => handleFieldChange("assignedUserId", v)} disabled={isLocked}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select sales rep..." /></SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget (Presentation) & Order Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                  <Input type="number" value={formData.budget} onChange={(e) => handleFieldChange("budget", e.target.value)} placeholder="0.00" className="pl-7" min="0" step="0.01" disabled={isLocked} />
                </div>
              </div>
              <div>
                <Label>Order Type</Label>
                <Select value={formData.orderType} onValueChange={(v) => handleFieldChange("orderType", v)} disabled={isLocked}>
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
                <Input type="date" value={formData.inHandsDate} onChange={(e) => handleFieldChange("inHandsDate", e.target.value)} className="mt-1" disabled={isLocked} />
              </div>
              <div>
                <Label>Event Date</Label>
                <Input type="date" value={formData.eventDate} onChange={(e) => handleFieldChange("eventDate", e.target.value)} className="mt-1" disabled={isLocked} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Order Description</Label>
              <Textarea value={formData.notes} onChange={(e) => handleFieldChange("notes", e.target.value)} placeholder="General order information..." rows={2} className="mt-1" disabled={isLocked} />
            </div>
          </div>

          {/* ===== SECTION: Quote & SO Fields ===== */}
          {showQuoteFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Supplier & Dates</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier In-Hands Date</Label>
                    <Input type="date" value={formData.supplierInHandsDate} onChange={(e) => handleFieldChange("supplierInHandsDate", e.target.value)} className="mt-1" disabled={isLocked} />
                    <p className="text-xs text-gray-400 mt-1">Visible to supplier on POs</p>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox id="isFirm" checked={formData.isFirm} onCheckedChange={(checked) => handleFieldChange("isFirm", checked)} disabled={isLocked} />
                    <Label htmlFor="isFirm" className="text-sm font-normal cursor-pointer">Firm In-Hands Date</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier Notes</Label>
                    <Textarea value={formData.supplierNotes} onChange={(e) => handleFieldChange("supplierNotes", e.target.value)} placeholder="Notes visible only to suppliers..." rows={2} className="mt-1" disabled={isLocked} />
                  </div>
                  <div>
                    <Label>Additional Information</Label>
                    <Textarea value={formData.additionalInformation} onChange={(e) => handleFieldChange("additionalInformation", e.target.value)} placeholder="Any other relevant details..." rows={2} className="mt-1" disabled={isLocked} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== SECTION: SO-specific Fields ===== */}
          {showSOFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Order Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(v) => handleFieldChange("paymentTerms", v)} disabled={isLocked}>
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
                    <Input value={formData.customerPo} onChange={(e) => handleFieldChange("customerPo", e.target.value)} placeholder="PO number (optional)" className="mt-1" disabled={isLocked} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== SECTION: Addresses (Quote & SO) ===== */}
          {showQuoteFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Addresses</h3>
                  <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowMoreSections(!showMoreSections)}>
                    {showMoreSections ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {showMoreSections ? "Collapse" : "Expand"}
                  </Button>
                </div>

                {/* Summary when collapsed */}
                {!showMoreSections && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-1">Billing</p>
                      {formData.billingStreet ? (
                        <p className="text-gray-700">{formData.billingStreet}, {formData.billingCity} {formData.billingState} {formData.billingZipCode}</p>
                      ) : (
                        <p className="text-gray-400 italic">No billing address</p>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-1">Shipping</p>
                      {formData.shippingStreet ? (
                        <p className="text-gray-700">{formData.shippingStreet}, {formData.shippingCity} {formData.shippingState} {formData.shippingZipCode}</p>
                      ) : (
                        <p className="text-gray-400 italic">No shipping address</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Full address forms when expanded */}
                {showMoreSections && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Billing */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold border-b pb-2">Billing Address</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Street</Label>
                          <AddressAutocomplete value={formData.billingStreet} onChange={(val) => handleFieldChange("billingStreet", val)} onAddressSelect={(addr) => { handleFieldChange("billingCity", addr.city); handleFieldChange("billingState", addr.state); handleFieldChange("billingZipCode", addr.zipCode); handleFieldChange("billingCountry", normalizeCountryCode(addr.country)); }} placeholder="123 Main St" disabled={isLocked} />
                        </div>
                        <div><Label className="text-xs">City</Label><Input value={formData.billingCity} onChange={(e) => handleFieldChange("billingCity", e.target.value)} disabled={isLocked} /></div>
                        <div><Label className="text-xs">State</Label><Input value={formData.billingState} onChange={(e) => handleFieldChange("billingState", e.target.value)} disabled={isLocked} /></div>
                        <div><Label className="text-xs">ZIP</Label><Input value={formData.billingZipCode} onChange={(e) => handleFieldChange("billingZipCode", e.target.value)} disabled={isLocked} /></div>
                        <div>
                          <Label className="text-xs">Country</Label>
                          <Select value={formData.billingCountry} onValueChange={(v) => handleFieldChange("billingCountry", v)} disabled={isLocked}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2"><Label className="text-xs">Phone</Label><Input value={formData.billingPhone} onChange={(e) => handleFieldChange("billingPhone", e.target.value)} placeholder="(555) 123-4567" disabled={isLocked} /></div>
                      </div>
                    </div>

                    {/* Shipping */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="text-sm font-semibold">Shipping Address</h4>
                        <div className="flex items-center gap-2">
                          <Checkbox id="sameAsBilling" checked={sameAsBilling} onCheckedChange={(checked) => setSameAsBilling(!!checked)} disabled={isLocked} />
                          <Label htmlFor="sameAsBilling" className="text-xs font-normal cursor-pointer">Same as Billing</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Street</Label>
                          <AddressAutocomplete value={formData.shippingStreet} onChange={(val) => handleFieldChange("shippingStreet", val)} onAddressSelect={(addr) => { handleFieldChange("shippingCity", addr.city); handleFieldChange("shippingState", addr.state); handleFieldChange("shippingZipCode", addr.zipCode); handleFieldChange("shippingCountry", normalizeCountryCode(addr.country)); }} placeholder="123 Main St" disabled={sameAsBilling || isLocked} />
                        </div>
                        <div><Label className="text-xs">City</Label><Input value={formData.shippingCity} onChange={(e) => handleFieldChange("shippingCity", e.target.value)} disabled={sameAsBilling || isLocked} /></div>
                        <div><Label className="text-xs">State</Label><Input value={formData.shippingState} onChange={(e) => handleFieldChange("shippingState", e.target.value)} disabled={sameAsBilling || isLocked} /></div>
                        <div><Label className="text-xs">ZIP</Label><Input value={formData.shippingZipCode} onChange={(e) => handleFieldChange("shippingZipCode", e.target.value)} disabled={sameAsBilling || isLocked} /></div>
                        <div>
                          <Label className="text-xs">Country</Label>
                          <Select value={formData.shippingCountry} onValueChange={(v) => handleFieldChange("shippingCountry", v)} disabled={sameAsBilling || isLocked}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2"><Label className="text-xs">Phone</Label><Input value={formData.shippingPhone} onChange={(e) => handleFieldChange("shippingPhone", e.target.value)} placeholder="(555) 123-4567" disabled={sameAsBilling || isLocked} /></div>
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
            <Button type="submit" disabled={createOrderMutation.isPending || updateOrderMutation.isPending || isLocked}>
              {isEditing
                ? (updateOrderMutation.isPending ? "Updating..." : "Update Project")
                : (createOrderMutation.isPending ? "Creating..." : "Create Order")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
