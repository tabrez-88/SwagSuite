import { useState, useMemo } from "react";
import { leadFormSchema, type LeadFormData } from "@/schemas/crm.schemas";
import {
  useLeads as useLeadsQuery,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
} from "@/services/leads";
import type { Lead } from "@/services/leads";

export type SortField = "name" | "company" | "source" | "status" | "estimatedValue" | "nextFollowUpDate";
export type SortDirection = "asc" | "desc";

export function useLeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: leads = [], isLoading } = useLeadsQuery();
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  const handleOpenCreate = () => {
    setSelectedLead(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (data: LeadFormData) => {
    if (selectedLead) {
      const payload: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        title: data.title || undefined,
        source: data.source,
        status: data.status,
        estimatedValue: data.estimatedValue || undefined,
        notes: data.notes || undefined,
        nextFollowUpDate: data.nextFollowUpDate || undefined,
      };
      updateLeadMutation.mutate(
        { id: selectedLead.id, data: payload },
        {
          onSuccess: () => {
            setIsFormDialogOpen(false);
            setSelectedLead(null);
          },
        }
      );
    } else {
      createLeadMutation.mutate(data, {
        onSuccess: () => {
          setIsFormDialogOpen(false);
        },
      });
    }
  };

  const handleDeleteLead = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLead = () => {
    if (leadToDelete) {
      deleteLeadMutation.mutate(leadToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setLeadToDelete(null);
        },
      });
    }
  };

  const cancelDeleteLead = () => {
    setLeadToDelete(null);
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

  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead: Lead) => {
      const matchesSearch =
        lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || lead.status === filterStatus;
      const matchesSource =
        filterSource === "all" || lead.source === filterSource;

      return matchesSearch && matchesStatus && matchesSource;
    });

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "company":
          return dir * (a.company || "").localeCompare(b.company || "");
        case "source":
          return dir * a.source.localeCompare(b.source);
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "estimatedValue":
          return dir * ((a.estimatedValue || 0) - (b.estimatedValue || 0));
        case "nextFollowUpDate":
          return dir * (new Date(a.nextFollowUpDate || 0).getTime() - new Date(b.nextFollowUpDate || 0).getTime());
        default:
          return 0;
      }
    });

    return result;
  }, [leads, searchQuery, filterStatus, filterSource, sortField, sortDirection]);

  const getLeadScore = (lead: Lead) => {
    let score = 0;
    if (lead.email) score += 20;
    if (lead.phone) score += 20;
    if (lead.company) score += 30;
    if (lead.estimatedValue && lead.estimatedValue > 1000) score += 30;
    return Math.min(score, 100);
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    isFormDialogOpen,
    setIsFormDialogOpen,
    selectedLead,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    leadToDelete,

    // Sort
    sortField,
    sortDirection,
    handleSort,

    // Data
    leads,
    isLoading,
    filteredLeads,

    // Mutations
    createLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,

    // Handlers
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteLead,
    confirmDeleteLead,
    cancelDeleteLead,
    getLeadScore,
  };
}
