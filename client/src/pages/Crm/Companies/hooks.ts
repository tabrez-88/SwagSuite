import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  useCompanies as useCompaniesQuery,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/services/companies";
import type { Company } from "@/services/companies";
import type { CompanyFormData } from "@/schemas/crm.schemas";

export type SortField = "name" | "industry" | "ytdSpend" | "engagementLevel" | "createdAt";
export type SortDirection = "asc" | "desc";

export function useCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterEngagement, setFilterEngagement] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [, setLocation] = useLocation();

  const { data: companies = [], isLoading } = useCompaniesQuery();

  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();

  // Custom fields state for the dialog
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});

  const handleOpenCreate = () => {
    setSelectedCompany(null);
    setEditCustomFields({});
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setSelectedCompany(company);
    setEditCustomFields(company.customFields ? { ...company.customFields } : {});
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (data: CompanyFormData) => {
    if (selectedCompany) {
      // Edit mode
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
            setIsFormDialogOpen(false);
            setSelectedCompany(null);
          },
        }
      );
    } else {
      // Create mode
      createCompanyMutation.mutate(
        {
          ...data,
          customFields: editCustomFields,
        } as any,
        {
          onSuccess: () => {
            setIsFormDialogOpen(false);
            setEditCustomFields({});
          },
        }
      );
    }
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
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

  const handleNavigateToCompany = (companyId: string) => {
    setLocation(`/crm/companies/${companyId}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = companies.filter((company: Company) => {
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

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "industry":
          return dir * (a.industry || "").localeCompare(b.industry || "");
        case "ytdSpend":
          return dir * (parseFloat(a.ytdSpend || "0") - parseFloat(b.ytdSpend || "0"));
        case "engagementLevel":
          return dir * (a.engagementLevel || "").localeCompare(b.engagementLevel || "");
        case "createdAt":
          return dir * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        default:
          return 0;
      }
    });

    return result;
  }, [companies, searchQuery, filterIndustry, filterEngagement, sortField, sortDirection]);

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
    isFormDialogOpen,
    setIsFormDialogOpen,
    selectedCompany,
    filterIndustry,
    setFilterIndustry,
    filterEngagement,
    setFilterEngagement,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    companyToDelete,

    // Sort
    sortField,
    sortDirection,
    handleSort,

    // Data
    companies,
    filteredCompanies,
    isLoading,

    // Mutations
    createCompanyMutation,
    updateCompanyMutation,
    deleteCompanyMutation,

    // Handlers
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteCompany,
    handleConfirmDelete,
    handleCancelDelete,
    handleNavigateToCompany,

    // Custom Fields
    editCustomFields,
    setEditCustomFields,

    // Utilities
    formatCurrency,
  };
}
