import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactManagerFormSchema as contactFormSchema, type ContactManagerFormData as ContactFormData } from "@/schemas/crm.schemas";
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
  department: "",
  noMarketing: false,
  isPrimary: false,
};

export function useContactsManager(companyId: string) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Separate forms for create and edit to prevent focus issues
  const createForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultFormValues,
  });

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

    editForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      department: contact.department || "",
      noMarketing: contact.noMarketing || false,
      isPrimary: contact.isPrimary,
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

  const handleToggleActive = (contact: Contact) => {
    updateContactMutation.mutate({
      id: contact.id,
      data: { isActive: !contact.isActive } as any,
    });
  };

  const filteredContacts = showInactive
    ? contacts
    : contacts.filter((c: Contact) => c.isActive !== false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedContact,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,
    setContactToDelete,
    showInactive,
    setShowInactive,
    createForm,
    editForm,
    contacts: filteredContacts,
    allContacts: contacts,
    isLoading,
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,
    handleCreateContact,
    handleUpdateContact,
    handleEditContact,
    handleDeleteContact,
    handleTogglePrimary,
    handleToggleActive,
    getInitials,
  };
}
