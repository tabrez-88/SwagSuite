import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorContactFormSchema as contactFormSchema,
  type VendorContactFormData as ContactFormData,
  type VendorFormData,
} from "@/schemas/crm.schemas";
import {
  useSuppliers,
  useVendorProducts,
  useVendorContacts,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  useTogglePreferred,
  useUpdateBenefits,
  useCreateVendorContact,
  useUpdateVendorContact,
  useDeleteVendorContact,
} from "@/services/suppliers";
import type { Vendor, VendorContact } from "@/services/suppliers";
import type { BenefitsFormState } from "./types";

export type SortField = "name" | "paymentTerms" | "productCount" | "ytdSpend" | "isPreferred";
export type SortDirection = "asc" | "desc";

export function useVendors() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);
  const [isEditBenefitsOpen, setIsEditBenefitsOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<VendorContact | null>(null);
  const [isDeleteVendorDialogOpen, setIsDeleteVendorDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [isDeleteContactDialogOpen, setIsDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<VendorContact | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showInactiveContacts, setShowInactiveContacts] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Benefits form state
  const [benefitsForm, setBenefitsForm] = useState<BenefitsFormState>({
    eqpPricing: 0,
    rebatePercentage: 0,
    freeSetups: false,
    freeSpecSamples: false,
    reducedSpecSamples: false,
    freeSelfPromo: false,
    reducedSelfPromo: false,
    ytdEqpSavings: 0,
    ytdRebates: 0,
    selfPromosSent: 0,
    specSamplesSent: 0,
  });

  // Fetch products for selected vendor
  const { data: vendorProducts, isLoading: isLoadingProducts } = useVendorProducts(
    selectedVendor?.id,
    !!selectedVendor && isVendorDetailOpen,
  );

  // Fetch contacts for selected vendor
  const { data: vendorContacts = [], isLoading: isLoadingContacts } = useVendorContacts(
    selectedVendor?.id,
    !!selectedVendor && isVendorDetailOpen,
  );

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      department: "",
      noMarketing: false,
      isPrimary: false,
      receiveOrderEmails: true,
    },
  });

  const { data: vendors = [], isLoading } = useSuppliers();

  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();
  const deleteVendorMutation = useDeleteVendor();
  const togglePreferredMutation = useTogglePreferred();
  const updateBenefitsMutation = useUpdateBenefits();
  const createContactMutation = useCreateVendorContact(selectedVendor?.id);
  const updateContactMutation = useUpdateVendorContact(selectedVendor?.id);
  const deleteContactMutation = useDeleteVendorContact(selectedVendor?.id);

  const handleOpenCreate = () => {
    setSelectedVendor(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (data: VendorFormData) => {
    if (selectedVendor) {
      updateVendorMutation.mutate(
        { id: selectedVendor.id, data },
        {
          onSuccess: () => {
            setIsFormDialogOpen(false);
            setSelectedVendor(null);
          },
        },
      );
    } else {
      createVendorMutation.mutate(data, {
        onSuccess: () => {
          setIsFormDialogOpen(false);
        },
      });
    }
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteVendorDialogOpen(true);
  };

  const handleTogglePreferred = (vendor: Vendor) => {
    togglePreferredMutation.mutate({
      vendorId: vendor.id,
      isPreferred: !vendor.isPreferred,
    });
  };

  // Initialize benefits form when vendor is selected
  useEffect(() => {
    if (selectedVendor?.preferredBenefits) {
      setBenefitsForm({
        eqpPricing: selectedVendor.preferredBenefits.eqpPricing || 0,
        rebatePercentage: selectedVendor.preferredBenefits.rebatePercentage || 0,
        freeSetups: selectedVendor.preferredBenefits.freeSetups || false,
        freeSpecSamples: selectedVendor.preferredBenefits.freeSpecSamples || false,
        reducedSpecSamples: selectedVendor.preferredBenefits.reducedSpecSamples || false,
        freeSelfPromo: selectedVendor.preferredBenefits.freeSelfPromo || false,
        reducedSelfPromo: selectedVendor.preferredBenefits.reducedSelfPromo || false,
        ytdEqpSavings: selectedVendor.preferredBenefits.ytdEqpSavings || 0,
        ytdRebates: selectedVendor.preferredBenefits.ytdRebates || 0,
        selfPromosSent: selectedVendor.preferredBenefits.selfPromosSent || 0,
        specSamplesSent: selectedVendor.preferredBenefits.specSamplesSent || 0,
      });
    }
  }, [selectedVendor, isEditBenefitsOpen]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    let result = vendors.filter((vendor: Vendor) => {
      const matchesSearch =
        !searchQuery ||
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "all") {
        return matchesSearch;
      } else if (activeTab === "preferred") {
        return matchesSearch && vendor.isPreferred;
      }

      return matchesSearch;
    });

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "paymentTerms":
          return dir * (a.paymentTerms || "").localeCompare(b.paymentTerms || "");
        case "productCount":
          return dir * ((a.productCount || 0) - (b.productCount || 0));
        case "ytdSpend":
          return dir * ((a.ytdSpend || 0) - (b.ytdSpend || 0));
        case "isPreferred":
          return dir * (Number(a.isPreferred || false) - Number(b.isPreferred || false));
        default:
          return 0;
      }
    });

    return result;
  }, [vendors, searchQuery, activeTab, sortField, sortDirection]);

  // Get preferred vendors specifically
  const preferredVendors = vendors.filter((vendor: Vendor) => vendor.isPreferred);

  // Filter contacts by active status
  const filteredContacts = showInactiveContacts
    ? vendorContacts
    : vendorContacts.filter((c) => c.isActive !== false);
  const inactiveContactCount = vendorContacts.filter((c) => c.isActive === false).length;

  const handleToggleActive = (contact: VendorContact) => {
    updateContactMutation.mutate({
      id: contact.id,
      data: { isActive: contact.isActive === false ? true : false },
    });
  };

  const handleEditContact = (contact: VendorContact) => {
    setSelectedContact(contact);
    contactForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      department: contact.department || "",
      noMarketing: contact.noMarketing || false,
      isPrimary: contact.isPrimary || false,
      receiveOrderEmails: contact.receiveOrderEmails !== false,
    });
    setIsEditContactOpen(true);
  };

  const handleDeleteContact = (contact: VendorContact) => {
    setContactToDelete(contact);
    setIsDeleteContactDialogOpen(true);
  };

  const handleAddContactSubmit = (data: ContactFormData) => {
    if (selectedVendor) {
      createContactMutation.mutate(
        { ...data, supplierId: selectedVendor.id },
        {
          onSuccess: () => {
            setIsAddContactOpen(false);
            contactForm.reset();
          },
        },
      );
    }
  };

  const handleEditContactSubmit = (data: ContactFormData) => {
    if (selectedContact) {
      updateContactMutation.mutate(
        { id: selectedContact.id, data },
        {
          onSuccess: () => {
            setIsEditContactOpen(false);
            setSelectedContact(null);
            contactForm.reset();
          },
        },
      );
    }
  };

  const handleSaveBenefits = () => {
    if (selectedVendor) {
      updateBenefitsMutation.mutate(
        {
          vendorId: selectedVendor.id,
          preferredBenefits: benefitsForm,
        },
        {
          onSuccess: (updatedVendor) => {
            if (selectedVendor) {
              setSelectedVendor({
                ...selectedVendor,
                preferredBenefits: updatedVendor.preferredBenefits || benefitsForm,
              });
            }
            setIsEditBenefitsOpen(false);
          },
        },
      );
    }
  };

  const handleConfirmDeleteVendor = () => {
    if (vendorToDelete) {
      deleteVendorMutation.mutate(vendorToDelete.id, {
        onSuccess: () => {
          setIsDeleteVendorDialogOpen(false);
          setVendorToDelete(null);
        },
      });
    }
  };

  const handleConfirmDeleteContact = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id, {
        onSuccess: () => {
          setIsDeleteContactDialogOpen(false);
          setContactToDelete(null);
        },
      });
    }
  };

  const handleOpenVendorDetail = (vendor: Vendor) => {
    setLocation(`/crm/vendors/${vendor.id}`);
  };

  const handleEditVendorFromDetail = () => {
    if (selectedVendor) {
      handleOpenEdit(selectedVendor);
      setIsVendorDetailOpen(false);
    }
  };

  const handleDeleteVendorFromDetail = () => {
    if (selectedVendor) {
      handleDeleteVendor(selectedVendor);
      setIsVendorDetailOpen(false);
    }
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    isFormDialogOpen,
    setIsFormDialogOpen,
    viewMode,
    setViewMode,
    selectedVendor,
    setSelectedVendor,
    isVendorDetailOpen,
    setIsVendorDetailOpen,
    isEditBenefitsOpen,
    setIsEditBenefitsOpen,
    isAddContactOpen,
    setIsAddContactOpen,
    isEditContactOpen,
    setIsEditContactOpen,
    selectedContact,
    setSelectedContact,
    isDeleteVendorDialogOpen,
    setIsDeleteVendorDialogOpen,
    vendorToDelete,
    setVendorToDelete,
    isDeleteContactDialogOpen,
    setIsDeleteContactDialogOpen,
    contactToDelete,
    setContactToDelete,
    activeTab,
    setActiveTab,
    benefitsForm,
    setBenefitsForm,
    showInactiveContacts,
    setShowInactiveContacts,

    // Sort
    sortField,
    sortDirection,
    handleSort,

    // Data
    vendors,
    isLoading,
    vendorProducts,
    isLoadingProducts,
    vendorContacts,
    filteredContacts,
    inactiveContactCount,
    isLoadingContacts,
    filteredVendors,
    preferredVendors,

    // Forms
    contactForm,

    // Mutations
    createVendorMutation,
    updateVendorMutation,
    deleteVendorMutation,
    togglePreferredMutation,
    updateBenefitsMutation,
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,

    // Handlers
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteVendor,
    handleTogglePreferred,
    handleEditContact,
    handleDeleteContact,
    handleToggleActive,
    handleAddContactSubmit,
    handleEditContactSubmit,
    handleSaveBenefits,
    handleConfirmDeleteVendor,
    handleConfirmDeleteContact,
    handleOpenVendorDetail,
    handleEditVendorFromDetail,
    handleDeleteVendorFromDetail,
  };
}
