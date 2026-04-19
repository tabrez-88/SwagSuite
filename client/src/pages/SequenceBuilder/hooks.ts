import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSequences, useSequenceEnrollments, sequenceKeys } from "@/services/sequences";
import { useCreateSequence, useReplaceSequence, useDeleteSequence, useCreateSequenceStep } from "@/services/sequences/mutations";
import { sequenceFormSchema, stepFormSchema, type SequenceFormData, type StepFormData } from "@/schemas/sequence.schemas";
import { useToast } from "@/hooks/use-toast";
import type { Sequence, SequenceStep } from "@shared/schema";

export function useSequenceBuilder() {
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [isDeleteSequenceDialogOpen, setIsDeleteSequenceDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch sequences
  const { data: sequences, isLoading: sequencesLoading } = useSequences() as unknown as {
    data: any;
    isLoading: boolean;
  };

  // Fetch steps for selected sequence
  const { data: steps } = useQuery<any>({
    queryKey: ["/api/sequences", selectedSequence?.id, "steps"],
    enabled: !!selectedSequence?.id,
  });

  // Fetch enrollments for selected sequence
  const { data: enrollments } = useSequenceEnrollments() as unknown as { data: any };
  void sequenceKeys;

  // Fetch analytics for selected sequence
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/sequences", selectedSequence?.id, "analytics"],
    enabled: !!selectedSequence?.id,
  });

  const createSequenceMutation = useCreateSequence();
  const updateSequenceMutation = useReplaceSequence();
  const deleteSequenceMutation = useDeleteSequence();
  const createStepMutation = useCreateSequenceStep(selectedSequence?.id!);

  // Forms
  const sequenceForm = useForm<SequenceFormData>({
    resolver: zodResolver(sequenceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
      automation: 100,
    },
  });

  const stepForm = useForm<StepFormData>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      type: "email",
      title: "",
      content: "",
      delayDays: 1,
      delayHours: 0,
      delayMinutes: 0,
      position: 1,
    },
  });

  const onCreateSequence = (data: SequenceFormData) => {
    createSequenceMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
        toast({ title: "Success", description: "Sequence created successfully" });
      },
    });
  };

  const onCreateStep = (data: StepFormData) => {
    createStepMutation.mutate(data, {
      onSuccess: () => {
        setShowStepDialog(false);
        setEditingStep(null);
        toast({ title: "Success", description: "Step created successfully" });
      },
    });
  };

  const toggleSequenceStatus = (sequence: Sequence) => {
    const newStatus = sequence.status === "active" ? "paused" : "active";
    updateSequenceMutation.mutate({
      id: sequence.id,
      data: { status: newStatus },
    }, {
      onSuccess: () => toast({ title: "Success", description: "Sequence updated successfully" }),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Mock analytics data for demo
  const mockAnalytics = {
    totalEnrollments: 156,
    openRate: 68.5,
    meetingRate: 12.8,
    interactionRate: 24.3,
    salesClosureRate: 8.7,
    performance: [
      { date: "2024-01-01", sent: 45, opened: 32, clicked: 12, meetings: 5 },
      { date: "2024-01-02", sent: 52, opened: 38, clicked: 15, meetings: 7 },
      { date: "2024-01-03", sent: 48, opened: 35, clicked: 14, meetings: 6 },
      { date: "2024-01-04", sent: 41, opened: 29, clicked: 11, meetings: 4 },
      { date: "2024-01-05", sent: 55, opened: 42, clicked: 18, meetings: 8 },
    ]
  };

  const openAddStepDialog = () => {
    stepForm.reset({
      type: "email",
      title: "",
      content: "",
      delayDays: 1,
      delayHours: 0,
      delayMinutes: 0,
      position: (steps?.length || 0) + 1,
    });
    setEditingStep(null);
    setShowStepDialog(true);
  };

  const openAddFirstStepDialog = () => {
    stepForm.reset({
      type: "email",
      title: "",
      content: "",
      delayDays: 1,
      delayHours: 0,
      delayMinutes: 0,
      position: 1,
    });
    setEditingStep(null);
    setShowStepDialog(true);
  };

  const confirmDeleteSequence = () => {
    if (selectedSequence) {
      deleteSequenceMutation.mutate(selectedSequence.id, {
        onSuccess: () => {
          setSelectedSequence(null);
          toast({ title: "Success", description: "Sequence deleted successfully" });
        },
      });
      setIsDeleteSequenceDialogOpen(false);
    }
  };

  return {
    // State
    selectedSequence,
    setSelectedSequence,
    showCreateDialog,
    setShowCreateDialog,
    showStepDialog,
    setShowStepDialog,
    editingStep,
    isDeleteSequenceDialogOpen,
    setIsDeleteSequenceDialogOpen,

    // Data
    sequences,
    sequencesLoading,
    steps,
    enrollments,
    analytics,
    mockAnalytics,

    // Mutations
    createSequenceMutation,
    updateSequenceMutation,
    deleteSequenceMutation,
    createStepMutation,

    // Forms
    sequenceForm,
    stepForm,

    // Handlers
    onCreateSequence,
    onCreateStep,
    toggleSequenceStatus,
    getStatusColor,
    openAddStepDialog,
    openAddFirstStepDialog,
    confirmDeleteSequence,
  };
}
