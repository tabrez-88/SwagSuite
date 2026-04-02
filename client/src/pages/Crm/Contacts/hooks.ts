import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/schemas/crm.schemas";
import { useContacts as useContactsQuery, useCreateContact, useUpdateContact, useDeleteContact } from "@/services/contacts";
import type { Contact } from "@/services/contacts";
import type { Company, Supplier, LeadSourceReport } from "./types";

export function useContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      leadSource: "",
      isPrimary: false,
      associationType: "none",
      companyId: "",
      supplierId: "",
    },
  });

  const editForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      leadSource: "",
      isPrimary: false,
      associationType: "none",
      companyId: "",
      supplierId: "",
    },
  });

  const editAssociationType = editForm.watch("associationType");
  const associationType = form.watch("associationType");

  const { data: contacts = [], isLoading } = useContactsQuery();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: leadSourceReport = [] } = useQuery<LeadSourceReport[]>({
    queryKey: ["/api/reports/lead-sources"],
  });

  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();

  const onSubmit = (data: ContactFormData) => {
    createContactMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        form.reset();
      },
    });
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    const assocType = contact.companyId
      ? "company"
      : contact.supplierId
        ? "vendor"
        : "none";
    editForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      leadSource: contact.leadSource || "",
      isPrimary: contact.isPrimary || false,
      associationType: assocType as "company" | "vendor" | "none",
      companyId: contact.companyId || "",
      supplierId: contact.supplierId || "",
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = (data: ContactFormData) => {
    if (!editingContact) return;
    const payload: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      title: data.title || undefined,
      leadSource: data.leadSource || undefined,
      isPrimary: data.isPrimary,
    };
    if (data.associationType === "company" && data.companyId) {
      payload.companyId = data.companyId;
      payload.supplierId = null;
    } else if (data.associationType === "vendor" && data.supplierId) {
      payload.supplierId = data.supplierId;
      payload.companyId = null;
    } else {
      payload.companyId = null;
      payload.supplierId = null;
    }
    updateContactMutation.mutate(
      { id: editingContact.id, data: payload as any },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditingContact(null);
          editForm.reset();
        },
      }
    );
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setContactToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setContactToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const filteredContacts = contacts.filter((contact: Contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" ||
      (filterType === "company" && contact.companyId) ||
      (filterType === "vendor" && contact.supplierId) ||
      (filterType === "unlinked" && !contact.companyId && !contact.supplierId);

    return matchesSearch && matchesType;
  });

  return {
    // State
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingContact,
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,

    // Form
    form,
    editForm,
    associationType,
    editAssociationType,
    onSubmit,
    handleEditContact,
    onEditSubmit,

    // Data
    contacts,
    isLoading,
    companies,
    suppliers,
    leadSourceReport,
    filteredContacts,

    // Mutations
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,

    // Handlers
    handleDeleteContact,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
