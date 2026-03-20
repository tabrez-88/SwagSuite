import { useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactManagerFormSchema as contactFormSchema, type ContactManagerFormData as ContactFormData } from "@/schemas/crm.schemas";
import { normalizeCountryCode } from "@/lib/address";
import {
  useContactsByCompany,
  useCreateCompanyContact,
  useUpdateContact,
  useDeleteContact,
} from "@/services/contacts";
import type { Contact } from "@/services/contacts";

const defaultFormValues: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  isPrimary: false,
  billingStreet: "",
  billingCity: "",
  billingState: "",
  billingZipCode: "",
  billingCountry: "",
  shippingStreet: "",
  shippingCity: "",
  shippingState: "",
  shippingZipCode: "",
  shippingCountry: "",
};

export function useContactsManager(companyId: string) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sameAsBillingCreate, setSameAsBillingCreate] = useState(false);
  const [sameAsBillingEdit, setSameAsBillingEdit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Separate forms for create and edit to prevent focus issues
  const createForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultFormValues,
  });

  // Sync shipping address with billing for edit form
  const billingStreetEdit = editForm.watch("billingStreet");
  const billingCityEdit = editForm.watch("billingCity");
  const billingStateEdit = editForm.watch("billingState");
  const billingZipCodeEdit = editForm.watch("billingZipCode");
  const billingCountryEdit = editForm.watch("billingCountry");

  React.useEffect(() => {
    if (sameAsBillingEdit) {
      editForm.setValue("shippingStreet", billingStreetEdit || "");
      editForm.setValue("shippingCity", billingCityEdit || "");
      editForm.setValue("shippingState", billingStateEdit || "");
      editForm.setValue("shippingZipCode", billingZipCodeEdit || "");
      editForm.setValue("shippingCountry", billingCountryEdit || "");
    }
  }, [sameAsBillingEdit, billingStreetEdit, billingCityEdit, billingStateEdit, billingZipCodeEdit, billingCountryEdit, editForm]);

  // Sync shipping address with billing for create form
  const billingStreetCreate = createForm.watch("billingStreet");
  const billingCityCreate = createForm.watch("billingCity");
  const billingStateCreate = createForm.watch("billingState");
  const billingZipCodeCreate = createForm.watch("billingZipCode");
  const billingCountryCreate = createForm.watch("billingCountry");

  React.useEffect(() => {
    if (sameAsBillingCreate) {
      createForm.setValue("shippingStreet", billingStreetCreate || "");
      createForm.setValue("shippingCity", billingCityCreate || "");
      createForm.setValue("shippingState", billingStateCreate || "");
      createForm.setValue("shippingZipCode", billingZipCodeCreate || "");
      createForm.setValue("shippingCountry", billingCountryCreate || "");
    }
  }, [sameAsBillingCreate, billingStreetCreate, billingCityCreate, billingStateCreate, billingZipCodeCreate, billingCountryCreate, createForm]);

  const { data: contacts = [], isLoading } = useContactsByCompany(companyId);

  const createContactMutation = useCreateCompanyContact(companyId);
  const updateContactMutation = useUpdateContact(companyId);
  const deleteContactMutation = useDeleteContact({ companyId });

  const handleCreateContact = (data: ContactFormData) => {
    createContactMutation.mutate({ companyId, data }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        createForm.reset();
      },
    });
  };

  const handleUpdateContact = (data: ContactFormData) => {
    if (selectedContact) {
      updateContactMutation.mutate({ id: selectedContact.id, data }, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedContact(null);
          editForm.reset();
        },
      });
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);

    // Reset checkbox
    setSameAsBillingEdit(false);

    // Parse billing address
    let billingStreet = "", billingCity = "", billingState = "", billingZipCode = "", billingCountry = "";
    if (contact.billingAddress) {
      try {
        const billing = JSON.parse(contact.billingAddress);
        billingStreet = billing.street || "";
        billingCity = billing.city || "";
        billingState = billing.state || "";
        billingZipCode = billing.zipCode || "";
        billingCountry = normalizeCountryCode(billing.country || "");
      } catch { }
    }

    // Parse shipping address
    let shippingStreet = "", shippingCity = "", shippingState = "", shippingZipCode = "", shippingCountry = "";
    if (contact.shippingAddress) {
      try {
        const shipping = JSON.parse(contact.shippingAddress);
        shippingStreet = shipping.street || "";
        shippingCity = shipping.city || "";
        shippingState = shipping.state || "";
        shippingZipCode = shipping.zipCode || "";
        shippingCountry = normalizeCountryCode(shipping.country || "");
      } catch { }
    }

    editForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      isPrimary: contact.isPrimary,
      billingStreet,
      billingCity,
      billingState,
      billingZipCode,
      billingCountry,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingZipCode,
      shippingCountry,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleTogglePrimary = (contact: Contact) => {
    updateContactMutation.mutate({
      id: contact.id,
      data: { isPrimary: !contact.isPrimary },
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedContact,
    sameAsBillingCreate,
    setSameAsBillingCreate,
    sameAsBillingEdit,
    setSameAsBillingEdit,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,
    setContactToDelete,
    createForm,
    editForm,
    contacts,
    isLoading,
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,
    handleCreateContact,
    handleUpdateContact,
    handleEditContact,
    handleDeleteContact,
    handleTogglePrimary,
    getInitials,
  };
}
