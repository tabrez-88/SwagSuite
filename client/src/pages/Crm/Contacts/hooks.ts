import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContacts as useContactsQuery, useCreateContact, useUpdateContact, useDeleteContact } from "@/services/contacts";
import type { Contact } from "@/services/contacts";
import type { ContactFormData } from "@/schemas/crm.schemas";
import type { Company, Supplier, LeadSourceReport } from "./types";

export type SortField = "name" | "company" | "email" | "title" | "leadSource";
export type SortDirection = "asc" | "desc";

export function useContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  const handleOpenCreate = () => {
    setSelectedContact(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (data: ContactFormData) => {
    if (selectedContact) {
      // Edit mode
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
        { id: selectedContact.id, data: payload as any },
        {
          onSuccess: () => {
            setIsFormDialogOpen(false);
            setSelectedContact(null);
          },
        }
      );
    } else {
      // Create mode
      createContactMutation.mutate(data, {
        onSuccess: () => {
          setIsFormDialogOpen(false);
        },
      });
    }
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredContacts = useMemo(() => {
    let result = contacts.filter((contact: Contact) => {
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

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "company":
          return dir * (a.companyName || a.supplierName || "").localeCompare(b.companyName || b.supplierName || "");
        case "email":
          return dir * (a.email || "").localeCompare(b.email || "");
        case "title":
          return dir * (a.title || "").localeCompare(b.title || "");
        case "leadSource":
          return dir * (a.leadSource || "").localeCompare(b.leadSource || "");
        default:
          return 0;
      }
    });

    return result;
  }, [contacts, searchQuery, filterType, sortField, sortDirection]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    isFormDialogOpen,
    setIsFormDialogOpen,
    selectedContact,
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,

    // Sort
    sortField,
    sortDirection,
    handleSort,

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
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteContact,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
