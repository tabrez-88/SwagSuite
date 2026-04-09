import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Company } from "@shared/schema";
import { useCompanyAddresses } from "@/services/company-addresses";
import { usePaymentTerms, useDefaultPaymentTermName } from "@/services/payment-terms";
import type { NewProjectWizardProps, StartingStage } from "./types";

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

export function useNewProjectWizard({ open, onOpenChange, initialCompanyId }: NewProjectWizardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const defaultPaymentTerm = useDefaultPaymentTermName();
  const { data: paymentTermsList = [] } = usePaymentTerms();

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
  const [paymentTerms, setPaymentTerms] = useState("");
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

  // Fetch company addresses for auto-fill
  const { data: companyAddresses = [] } = useCompanyAddresses(companyId || undefined);

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
      setPaymentTerms(defaultPaymentTerm || "");
      setCustomerPo("");
    }
  }, [open, initialCompanyId, defaultPaymentTerm]);

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

  // Auto-populate addresses from company addresses (CommonSKU-style)
  useEffect(() => {
    if (!companyId || startingStage === "presentation" || companyAddresses.length === 0) return;

    // Find default billing address (or first billing/both)
    const billingAddrs = companyAddresses.filter((a) => a.addressType === "billing" || a.addressType === "both");
    const defaultBilling = billingAddrs.find((a) => a.isDefault) || billingAddrs[0];
    if (defaultBilling) {
      setBillingStreet(defaultBilling.street || "");
      setBillingCity(defaultBilling.city || "");
      setBillingState(defaultBilling.state || "");
      setBillingZipCode(defaultBilling.zipCode || "");
      setBillingCountry(normalizeCountryCode(defaultBilling.country || "US"));
    }

    // Find default shipping address (or first shipping/both)
    const shippingAddrs = companyAddresses.filter((a) => a.addressType === "shipping" || a.addressType === "both");
    const defaultShipping = shippingAddrs.find((a) => a.isDefault) || shippingAddrs[0];
    if (defaultShipping) {
      setShippingStreet(defaultShipping.street || "");
      setShippingCity(defaultShipping.city || "");
      setShippingState(defaultShipping.state || "");
      setShippingZipCode(defaultShipping.zipCode || "");
      setShippingCountry(normalizeCountryCode(defaultShipping.country || "US"));
    }
  }, [companyId, companyAddresses, startingStage]);

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
      const res = await apiRequest("POST", "/api/projects", payload);
      return res.json();
    },
    onSuccess: (newOrder) => {
      toast({ title: "Project created", description: `Project #${newOrder.orderNumber} has been created.` });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onOpenChange(false);
      if (newOrder.id) {
        setLocation(`/projects/${newOrder.id}`);
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
    if (startingStage !== "presentation") {
      if (billingStreet || billingCity) {
        payload.billingAddress = JSON.stringify({
          street: billingStreet, city: billingCity, state: billingState,
          zipCode: billingZipCode, country: billingCountry,
        });
      }
      const shipStreet = sameAsBilling ? billingStreet : shippingStreet;
      const shipCity = sameAsBilling ? billingCity : shippingCity;
      const shipState = sameAsBilling ? billingState : shippingState;
      const shipZip = sameAsBilling ? billingZipCode : shippingZipCode;
      const shipCountry = sameAsBilling ? billingCountry : shippingCountry;
      if (shipStreet || shipCity) {
        payload.shippingAddress = JSON.stringify({
          street: shipStreet, city: shipCity, state: shipState,
          zipCode: shipZip, country: shipCountry,
        });
      }
    }
    createMutation.mutate(payload);
  };

  const handleCreateContact = () => {
    createContactMutation.mutate({
      companyId,
      firstName: newContactFirstName.trim(),
      lastName: newContactLastName.trim(),
      email: newContactEmail || undefined,
      phone: newContactPhone || undefined,
      title: newContactTitle || undefined,
    });
  };

  const handleBillingAddressSelect = (addr: { city: string; state: string; zipCode: string; country: string }) => {
    setBillingCity(addr.city);
    setBillingState(addr.state);
    setBillingZipCode(addr.zipCode);
    setBillingCountry(normalizeCountryCode(addr.country));
  };

  const handleShippingAddressSelect = (addr: { city: string; state: string; zipCode: string; country: string }) => {
    setShippingCity(addr.city);
    setShippingState(addr.state);
    setShippingZipCode(addr.zipCode);
    setShippingCountry(normalizeCountryCode(addr.country));
  };

  const needsAddresses = startingStage !== "presentation";
  const isSalesOrder = startingStage === "sales_order";

  return {
    // Step
    step,
    setStep,

    // Step 1
    companyId,
    setCompanyId,
    projectName,
    setProjectName,
    startingStage,
    setStartingStage,
    budget,
    setBudget,
    openCustomerCombo,
    setOpenCustomerCombo,

    // Step 2
    contactId,
    setContactId,
    inHandsDate,
    setInHandsDate,
    eventDate,
    setEventDate,

    // New contact
    showNewContactForm,
    setShowNewContactForm,
    newContactFirstName,
    setNewContactFirstName,
    newContactLastName,
    setNewContactLastName,
    newContactEmail,
    setNewContactEmail,
    newContactPhone,
    setNewContactPhone,
    newContactTitle,
    setNewContactTitle,

    // Addresses
    billingStreet,
    setBillingStreet,
    billingCity,
    setBillingCity,
    billingState,
    setBillingState,
    billingZipCode,
    setBillingZipCode,
    billingCountry,
    setBillingCountry,
    shippingStreet,
    setShippingStreet,
    shippingCity,
    setShippingCity,
    shippingState,
    setShippingState,
    shippingZipCode,
    setShippingZipCode,
    shippingCountry,
    setShippingCountry,
    sameAsBilling,
    setSameAsBilling,

    // SO fields
    paymentTerms,
    setPaymentTerms,
    paymentTermsList,
    customerPo,
    setCustomerPo,

    // Data
    companies,
    contacts,
    companyContacts,

    // Computed
    needsAddresses,
    isSalesOrder,

    // Mutations
    createIsPending: createMutation.isPending,
    createContactIsPending: createContactMutation.isPending,

    // Handlers
    handleSubmit,
    handleCreateContact,
    handleBillingAddressSelect,
    handleShippingAddressSelect,
  };
}
