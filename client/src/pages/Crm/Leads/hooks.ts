import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, type LeadFormData } from "@/schemas/crm.schemas";
import {
  useLeads as useLeadsQuery,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
} from "@/services/leads";
import type { Lead } from "@/services/leads";

export function useLeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      source: "",
      status: "new",
      estimatedValue: 0,
      notes: "",
      nextFollowUpDate: "",
    },
  });

  const editForm = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      source: "",
      status: "new",
      estimatedValue: 0,
      notes: "",
      nextFollowUpDate: "",
    },
  });

  const { data: leads = [], isLoading } = useLeadsQuery();
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        form.reset();
      },
    });
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    editForm.reset({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      title: lead.title || "",
      source: lead.source,
      status: lead.status,
      estimatedValue: lead.estimatedValue ?? 0,
      notes: lead.notes || "",
      nextFollowUpDate: lead.nextFollowUpDate
        ? new Date(lead.nextFollowUpDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = (data: LeadFormData) => {
    if (!editingLead) return;
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
      { id: editingLead.id, data: payload },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditingLead(null);
          editForm.reset();
        },
      }
    );
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

  const filteredLeads = leads.filter((lead: Lead) => {
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
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingLead,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    leadToDelete,

    // Form
    form,
    editForm,

    // Data
    leads,
    isLoading,
    filteredLeads,

    // Mutations
    createLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,

    // Handlers
    onSubmit,
    handleEditLead,
    onEditSubmit,
    handleDeleteLead,
    confirmDeleteLead,
    cancelDeleteLead,
    getLeadScore,
  };
}
