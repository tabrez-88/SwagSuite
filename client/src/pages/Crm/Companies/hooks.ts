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

  const [, setLocation] = useLocation();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
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
    createCompanyMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        form.reset();
      },
    });
  };

  const handleUpdateCompany = (data: CompanyFormData) => {
    if (selectedCompany) {
      updateCompanyMutation.mutate(
        { id: selectedCompany.id, data },
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
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      country: company.country || "US",
      industry: company.industry || "",
      notes: company.notes || "",
      linkedinUrl: company.socialMediaLinks?.linkedin || "",
      twitterUrl: company.socialMediaLinks?.twitter || "",
      facebookUrl: company.socialMediaLinks?.facebook || "",
      instagramUrl: company.socialMediaLinks?.instagram || "",
      otherSocialUrl: company.socialMediaLinks?.other || "",
    });

    setIsEditModalOpen(true);
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

  const handleNavigateToCompany = (companyId: number) => {
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

    // Utilities
    formatCurrency,
  };
}
