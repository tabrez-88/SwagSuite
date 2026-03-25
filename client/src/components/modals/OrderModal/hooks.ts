import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Company } from "@shared/schema";
import { useCompanyAddresses } from "@/services/company-addresses";
import type { OrderModalProps, OrderFormData } from "./types";

// Normalize various country name/code formats to standard 2-letter codes
export function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    "USA": "US", "U.S.": "US", "U.S.A.": "US",
    "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US",
    "CANADA": "CA", "CAN": "CA",
    "MEXICO": "MX", "MEX": "MX", "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

const INITIAL_FORM_DATA: OrderFormData = {
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
};

export function useOrderModal({ open, onOpenChange, order, initialCompanyId, businessStageId }: OrderModalProps) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<OrderFormData>(INITIAL_FORM_DATA);
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [showMoreSections, setShowMoreSections] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditing = !!order;
  const stage = businessStageId || "presentation";

  // Stage visibility helpers
  const showPresentation = true;
  const showQuoteFields = stage === "quote" || stage === "sales_order" || stage === "invoice";
  const showSOFields = stage === "sales_order" || stage === "invoice";
  const isLocked = stage === "invoice";

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

  // Fetch company addresses for auto-fill
  const { data: companyAddresses = [] } = useCompanyAddresses(formData.companyId || undefined);

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users/team"],
    enabled: open,
  });

  // Reset or populate form when opening
  useEffect(() => {
    if (open) {
      if (order) {
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
          ...INITIAL_FORM_DATA,
          companyId: initialCompanyId || "",
          assignedUserId: currentUser?.id || "",
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

  // Auto-fill contact name/email when contact is selected
  useEffect(() => {
    if (formData.contactId && contacts.length > 0) {
      const selectedContact = contacts.find((c: any) => c.id === formData.contactId);
      if (selectedContact) {
        const contactFullName = `${selectedContact.firstName} ${selectedContact.lastName}`;
        const contactEmail = selectedContact.email || "";
        setFormData((prev) => ({
          ...prev,
          billingContact: contactFullName, billingEmail: contactEmail, billingPhone: selectedContact.phone || "",
          shippingContact: contactFullName, shippingEmail: contactEmail,
        }));
      }
    }
  }, [formData.contactId, contacts]);

  // Auto-fill addresses from company addresses (CommonSKU-style)
  useEffect(() => {
    if (!formData.companyId || companyAddresses.length === 0) return;

    const billingAddrs = companyAddresses.filter((a) => a.addressType === "billing" || a.addressType === "both");
    const defaultBilling = billingAddrs.find((a) => a.isDefault) || billingAddrs[0];
    if (defaultBilling) {
      setFormData((prev) => ({
        ...prev,
        billingStreet: defaultBilling.street || "", billingCity: defaultBilling.city || "",
        billingState: defaultBilling.state || "", billingZipCode: defaultBilling.zipCode || "",
        billingCountry: normalizeCountryCode(defaultBilling.country || "US"),
      }));
    }

    const shippingAddrs = companyAddresses.filter((a) => a.addressType === "shipping" || a.addressType === "both");
    const defaultShipping = shippingAddrs.find((a) => a.isDefault) || shippingAddrs[0];
    if (defaultShipping) {
      setFormData((prev) => ({
        ...prev,
        shippingStreet: defaultShipping.street || "", shippingCity: defaultShipping.city || "",
        shippingState: defaultShipping.state || "", shippingZipCode: defaultShipping.zipCode || "",
        shippingCountry: normalizeCountryCode(defaultShipping.country || "US"),
      }));
    }
  }, [formData.companyId, companyAddresses]);

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
    payload.inHandsDate = formData.inHandsDate ? new Date(formData.inHandsDate) : null;
    payload.eventDate = formData.eventDate ? new Date(formData.eventDate) : null;
    payload.supplierInHandsDate = formData.supplierInHandsDate ? new Date(formData.supplierInHandsDate) : null;
    payload.isFirm = formData.isFirm;
    payload.projectName = formData.projectName || undefined;
    payload.budget = formData.budget || undefined;
    payload.paymentTerms = formData.paymentTerms || undefined;
    payload.customerPo = formData.customerPo || undefined;
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
    const addressFields = ["billingContact", "billingEmail", "billingStreet", "billingCity", "billingState", "billingZipCode", "billingCountry", "billingPhone", "shippingContact", "shippingEmail", "shippingStreet", "shippingCity", "shippingState", "shippingZipCode", "shippingCountry", "shippingPhone"];
    addressFields.forEach((f) => delete payload[f]);
    if (order) {
      updateOrderMutation.mutate(payload);
    } else {
      createOrderMutation.mutate(payload);
    }
  };

  const stageLabel = stage === "presentation" ? "Presentation" : stage === "quote" ? "Quote" : stage === "sales_order" ? "Sales Order" : "Invoice";

  return {
    formData,
    handleFieldChange,
    openCustomerCombo,
    setOpenCustomerCombo,
    sameAsBilling,
    setSameAsBilling,
    showMoreSections,
    setShowMoreSections,
    isEditing,
    stage,
    stageLabel,
    showPresentation,
    showQuoteFields,
    showSOFields,
    isLocked,
    companies,
    contacts,
    users,
    handleSubmit,
    createIsPending: createOrderMutation.isPending,
    updateIsPending: updateOrderMutation.isPending,
    normalizeCountryCode,
  };
}
