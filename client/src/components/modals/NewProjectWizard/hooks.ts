import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/lib/wouter-compat";
import type { Company } from "@shared/schema";
import { useCompanyAddresses } from "@/services/company-addresses";
import { usePaymentTerms, useDefaultPaymentTermName } from "@/services/payment-terms";
import { useCreateProject } from "@/services/projects/mutations";
import { useCreateSimpleContact } from "@/services/contacts/mutations";
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
  const [billingStreet2, setBillingStreet2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZipCode, setBillingZipCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("US");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingStreet2, setShippingStreet2] = useState("");
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
      setBillingStreet2("");
      setBillingCity("");
      setBillingState("");
      setBillingZipCode("");
      setBillingCountry("US");
      setShippingStreet("");
      setShippingStreet2("");
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
      setBillingStreet2(defaultBilling.street2 || "");
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
      setShippingStreet2(defaultShipping.street2 || "");
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
      setShippingStreet2(billingStreet2);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingZipCode(billingZipCode);
      setShippingCountry(billingCountry);
    }
  }, [sameAsBilling, billingStreet, billingStreet2, billingCity, billingState, billingZipCode, billingCountry]);

  const companyContacts = contacts.filter((c: any) => c.companyId === companyId);

  const createMutation = useCreateProject();

  const createContactMutation = useCreateSimpleContact();

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
      // Snapshot recipient name + contact info into address JSON so SO/PO PDFs render it
      // Source: selected contact (preferred) → company name fallback
      const selectedContact = contacts.find((c: any) => c.id === contactId);
      const selectedCompany = companies.find((c: any) => c.id === companyId);
      const contactFullName = selectedContact
        ? `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim()
        : '';
      const contactEmail = selectedContact?.email || '';
      const contactPhone = selectedContact?.phone || '';
      const recipientCompanyName = selectedCompany?.name || '';

      if (billingStreet || billingCity) {
        payload.billingAddress = JSON.stringify({
          contactName: contactFullName, companyName: recipientCompanyName,
          email: contactEmail, phone: contactPhone,
          street: billingStreet, street2: billingStreet2, city: billingCity, state: billingState,
          zipCode: billingZipCode, country: billingCountry,
        });
      }
      const shipStreet = sameAsBilling ? billingStreet : shippingStreet;
      const shipStreet2 = sameAsBilling ? billingStreet2 : shippingStreet2;
      const shipCity = sameAsBilling ? billingCity : shippingCity;
      const shipState = sameAsBilling ? billingState : shippingState;
      const shipZip = sameAsBilling ? billingZipCode : shippingZipCode;
      const shipCountry = sameAsBilling ? billingCountry : shippingCountry;
      if (shipStreet || shipCity) {
        payload.shippingAddress = JSON.stringify({
          contactName: contactFullName, companyName: recipientCompanyName,
          email: contactEmail, phone: contactPhone,
          street: shipStreet, street2: shipStreet2, city: shipCity, state: shipState,
          zipCode: shipZip, country: shipCountry,
        });
      }
    }
    createMutation.mutate(payload, {
      onSuccess: (newOrder: any) => {
        onOpenChange(false);
        if (newOrder.id) setLocation(`/projects/${newOrder.id}`);
      },
    });
  };

  const handleCreateContact = () => {
    createContactMutation.mutate({
      companyId,
      firstName: newContactFirstName.trim(),
      lastName: newContactLastName.trim(),
      email: newContactEmail || undefined,
      phone: newContactPhone || undefined,
      title: newContactTitle || undefined,
    }, {
      onSuccess: (newContact: any) => {
        setContactId(newContact.id);
        setShowNewContactForm(false);
        setNewContactFirstName("");
        setNewContactLastName("");
        setNewContactEmail("");
        setNewContactPhone("");
        setNewContactTitle("");
      },
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
    billingStreet2,
    setBillingStreet2,
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
    shippingStreet2,
    setShippingStreet2,
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
