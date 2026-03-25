import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import {
  useCompanies as useCompaniesQuery,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/services/companies";
import type { Company } from "@/services/companies";
import { companyFormSchema, type CompanyFormData } from "@/schemas/crm.schemas";
export function useCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterEngagement, setFilterEngagement] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isCompanyDetailOpen, setIsCompanyDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});
  const [newCustomFieldKey, setNewCustomFieldKey] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");

  const [, setLocation] = useLocation();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      industry: "",
      notes: "",
      linkedinUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      otherSocialUrl: "",
    },
  });

  const { data: companies = [], isLoading } = useCompaniesQuery();

  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();

  const handleCreateCompany = (data: CompanyFormData) => {
    createCompanyMutation.mutate(
      {
        ...data,
        customFields: editCustomFields,
      } as any,
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          form.reset();
          setEditCustomFields({});
          setNewCustomFieldKey("");
          setNewCustomFieldValue("");
        },
      }
    );
  };

  const handleUpdateCompany = (data: CompanyFormData) => {
    if (selectedCompany) {
      updateCompanyMutation.mutate(
        {
          id: selectedCompany.id,
          data: {
            ...data,
            customFields: editCustomFields,
          },
        } as any,
        {
          onSuccess: () => {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            form.reset();
          },
        }
      );
    }
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);

    form.reset({
      name: company.name,
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      industry: company.industry || "",
      notes: company.notes || "",
      linkedinUrl: company.socialMediaLinks?.linkedin || "",
      twitterUrl: company.socialMediaLinks?.twitter || "",
      facebookUrl: company.socialMediaLinks?.facebook || "",
      instagramUrl: company.socialMediaLinks?.instagram || "",
      otherSocialUrl: company.socialMediaLinks?.other || "",
    });

    setEditCustomFields(company.customFields ? { ...company.customFields } : {});
    setNewCustomFieldKey("");
    setNewCustomFieldValue("");
    setIsEditModalOpen(true);
  };

  // Custom field helpers
  const addCustomField = () => {
    if (newCustomFieldKey.trim()) {
      setEditCustomFields({ ...editCustomFields, [newCustomFieldKey.trim()]: newCustomFieldValue });
      setNewCustomFieldKey("");
      setNewCustomFieldValue("");
    }
  };

  const updateCustomFieldValue = (key: string, value: string) => {
    setEditCustomFields({ ...editCustomFields, [key]: value });
  };

  const removeCustomField = (key: string) => {
    const updated = { ...editCustomFields };
    delete updated[key];
    setEditCustomFields(updated);
  };

  const handleConfirmDelete = () => {
    if (companyToDelete) {
      deleteCompanyMutation.mutate(companyToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setCompanyToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setCompanyToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleOpenDetailFromList = (company: Company) => {
    setSelectedCompany(company);
    setIsCompanyDetailOpen(true);
  };

  const handleEditFromDetail = () => {
    if (selectedCompany) {
      handleEditCompany(selectedCompany);
      setIsCompanyDetailOpen(false);
    }
  };

  const handleNavigateToCompany = (companyId: string) => {
    setLocation(`/crm/companies/${companyId}`);
  };

  // Filter companies based on search query and filters
  const filteredCompanies = companies.filter((company: Company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      filterIndustry === "all" || company.industry === filterIndustry;
    const matchesEngagement =
      filterEngagement === "all" ||
      company.engagementLevel === filterEngagement;

    return matchesSearch && matchesIndustry && matchesEngagement;
  });

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedCompany,
    filterIndustry,
    setFilterIndustry,
    filterEngagement,
    setFilterEngagement,
    viewMode,
    setViewMode,
    isCompanyDetailOpen,
    setIsCompanyDetailOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    companyToDelete,

    // Form
    form,

    // Data
    companies,
    filteredCompanies,
    isLoading,

    // Mutations
    createCompanyMutation,
    updateCompanyMutation,
    deleteCompanyMutation,

    // Handlers
    handleCreateCompany,
    handleUpdateCompany,
    handleDeleteCompany,
    handleEditCompany,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenDetailFromList,
    handleEditFromDetail,
    handleNavigateToCompany,

    // Custom Fields (Edit modal)
    editCustomFields,
    newCustomFieldKey,
    setNewCustomFieldKey,
    newCustomFieldValue,
    setNewCustomFieldValue,
    addCustomField,
    updateCustomFieldValue,
    removeCustomField,

    // Utilities
    formatCurrency,
  };
}
