import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/schemas/crm.schemas";
import { useContacts as useContactsQuery, useCreateContact, useDeleteContact } from "@/services/contacts";
import type { Contact } from "@/services/contacts";
import type { Company, Supplier, LeadSourceReport } from "./types";

export function useContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
  const deleteContactMutation = useDeleteContact();

  const onSubmit = (data: ContactFormData) => {
    createContactMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        form.reset();
      },
    });
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
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,

    // Form
    form,
    associationType,
    onSubmit,

    // Data
    contacts,
    isLoading,
    companies,
    suppliers,
    leadSourceReport,
    filteredContacts,

    // Mutations
    createContactMutation,
    deleteContactMutation,

    // Handlers
    handleDeleteContact,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
