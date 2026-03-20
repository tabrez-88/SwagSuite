import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorContactFormSchema as contactFormSchema,
  type VendorContactFormData as ContactFormData,
  vendorFormSchema,
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

export function useVendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterPreferred, setFilterPreferred] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);
  const [isEditBenefitsOpen, setIsEditBenefitsOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<VendorContact | null>(null);
  const [isDeleteVendorDialogOpen, setIsDeleteVendorDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [isDeleteContactDialogOpen, setIsDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<VendorContact | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

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

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      contactPerson: "",
      paymentTerms: "",
      notes: "",
      isPreferred: false,
      eqpPricing: undefined,
      rebatePercentage: undefined,
      freeSetups: false,
      freeSpecSamples: false,
      freeSelfPromo: false,
      reducedSpecSamples: false,
    },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
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

  const onSubmit = (data: VendorFormData) => {
    createVendorMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        form.reset();
      },
    });
  };

  const onUpdateSubmit = (data: VendorFormData) => {
    if (selectedVendor) {
      updateVendorMutation.mutate(
        { id: selectedVendor.id, data },
        {
          onSuccess: () => {
            setIsEditVendorOpen(false);
            setSelectedVendor(null);
          },
        },
      );
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    form.reset({
      name: vendor.name || "",
      email: "",
      phone: "",
      website: vendor.website || "",
      address: vendor.address || "",
      contactPerson: "",
      paymentTerms: vendor.paymentTerms || "",
      notes: vendor.notes || "",
      isPreferred: vendor.isPreferred || false,
      doNotOrder: vendor.doNotOrder || false,
      eqpPricing: vendor.preferredBenefits?.eqpPricing || undefined,
      rebatePercentage: vendor.preferredBenefits?.rebatePercentage || undefined,
      freeSetups: vendor.preferredBenefits?.freeSetups || false,
      freeSpecSamples: vendor.preferredBenefits?.freeSpecSamples || false,
      freeSelfPromo: vendor.preferredBenefits?.freeSelfPromo || false,
      reducedSpecSamples: vendor.preferredBenefits?.reducedSpecSamples || false,
    });
    setIsEditVendorOpen(true);
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

  // Filter vendors based on search and tab selection
  const filteredVendors = vendors.filter((vendor: Vendor) => {
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

  // Get preferred vendors specifically
  const preferredVendors = vendors.filter((vendor: Vendor) => vendor.isPreferred);

  const handleEditContact = (contact: VendorContact) => {
    setSelectedContact(contact);
    contactForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
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
    setSelectedVendor(vendor);
    setIsVendorDetailOpen(true);
  };

  const handleEditVendorFromDetail = () => {
    if (selectedVendor) {
      handleEditVendor(selectedVendor);
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
    isCreateModalOpen,
    setIsCreateModalOpen,
    filterPreferred,
    setFilterPreferred,
    viewMode,
    setViewMode,
    selectedVendor,
    setSelectedVendor,
    isVendorDetailOpen,
    setIsVendorDetailOpen,
    isEditBenefitsOpen,
    setIsEditBenefitsOpen,
    isEditVendorOpen,
    setIsEditVendorOpen,
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

    // Data
    vendors,
    isLoading,
    vendorProducts,
    isLoadingProducts,
    vendorContacts,
    isLoadingContacts,
    filteredVendors,
    preferredVendors,

    // Forms
    form,
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
    onSubmit,
    onUpdateSubmit,
    handleEditVendor,
    handleDeleteVendor,
    handleTogglePreferred,
    handleEditContact,
    handleDeleteContact,
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
