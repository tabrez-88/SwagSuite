import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateError, useUpdateError, useResolveError } from "@/services/errors";
import { useToast } from "@/hooks/use-toast";
import { insertErrorSchema, type Error, type InsertError } from "@shared/schema";
import type { UseErrorsReturn } from "./types";

// Sample data for charts and analytics
const sampleErrors = [
  {
    id: "1",
    orderId: null,
    date: new Date("2024-03-15T10:30:00Z"),
    projectNumber: "ORD-2024-001",
    errorType: "printing",
    clientName: "Sample Client",
    vendorName: null,
    additionalNotes: "Incorrect ink color used on t-shirts",
    responsibleParty: "lsd",
    resolution: "other",
    costToLsd: "150.00",
    isResolved: true,
    orderRep: "Sarah Johnson",
    productionRep: "Mike Chen",
    clientRep: null,
    resolvedAt: null,
    resolvedBy: null,
    createdBy: null,
    createdAt: new Date("2024-03-15T10:30:00Z"),
    updatedAt: new Date("2024-03-16T09:15:00Z"),
  },
  {
    id: "2",
    orderId: null,
    date: new Date("2024-03-18T14:20:00Z"),
    projectNumber: "ORD-2024-002",
    errorType: "shipping",
    clientName: "Sample Client",
    vendorName: null,
    additionalNotes: "Vendor delayed shipment by 3 days",
    responsibleParty: "vendor",
    resolution: "other",
    costToLsd: "75.50",
    isResolved: false,
    orderRep: "Emily Davis",
    productionRep: "David Wilson",
    clientRep: null,
    resolvedAt: null,
    resolvedBy: null,
    createdBy: null,
    createdAt: new Date("2024-03-18T14:20:00Z"),
    updatedAt: new Date("2024-03-18T14:20:00Z"),
  },
  {
    id: "3",
    orderId: null,
    date: new Date("2024-03-20T11:45:00Z"),
    projectNumber: "ORD-2024-003",
    errorType: "other",
    clientName: "Sample Client",
    vendorName: null,
    additionalNotes: "Customer ordered 100 but received 75 units",
    responsibleParty: "customer",
    resolution: "other",
    costToLsd: "0.00",
    isResolved: true,
    orderRep: "Alex Rodriguez",
    productionRep: "Lisa Thompson",
    clientRep: null,
    resolvedAt: null,
    resolvedBy: null,
    createdBy: null,
    createdAt: new Date("2024-03-20T11:45:00Z"),
    updatedAt: new Date("2024-03-21T16:30:00Z"),
  },
  {
    id: "4",
    orderId: null,
    date: new Date("2024-03-22T09:00:00Z"),
    projectNumber: "ORD-2024-004",
    errorType: "pricing",
    clientName: "Sample Client",
    vendorName: null,
    additionalNotes: "Defective materials used in production",
    responsibleParty: "vendor",
    resolution: "other",
    costToLsd: "340.25",
    isResolved: false,
    orderRep: "James Wilson",
    productionRep: "Sarah Johnson",
    clientRep: null,
    resolvedAt: null,
    resolvedBy: null,
    createdBy: null,
    createdAt: new Date("2024-03-22T09:00:00Z"),
    updatedAt: new Date("2024-03-22T09:00:00Z"),
  },
  {
    id: "5",
    orderId: null,
    date: new Date("2024-03-25T13:15:00Z"),
    projectNumber: "ORD-2024-005",
    errorType: "artwork_proofing",
    clientName: "Sample Client",
    vendorName: null,
    additionalNotes: "Logo placement incorrect on merchandise",
    responsibleParty: "lsd",
    resolution: "other",
    costToLsd: "125.00",
    isResolved: true,
    orderRep: "Mike Chen",
    productionRep: "Emily Davis",
    clientRep: null,
    resolvedAt: null,
    resolvedBy: null,
    createdBy: null,
    createdAt: new Date("2024-03-25T13:15:00Z"),
    updatedAt: new Date("2024-03-26T10:45:00Z"),
  },
] as Error[];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];

function formatErrorType(type: string): string {
  const types: Record<string, string> = {
    pricing: "Pricing Error",
    in_hands_date: "In-Hands Date Issue",
    shipping: "Shipping Error",
    printing: "Printing Error",
    artwork_proofing: "Artwork/Proofing",
    oos: "Out of Stock",
    other: "Other",
  };
  return types[type] || type;
}

function formatResponsibleParty(party: string): string {
  const parties: Record<string, string> = {
    customer: "Customer",
    vendor: "Vendor",
    lsd: "LSD",
  };
  return parties[party] || party;
}

function getErrorTypeBadge(type: string): string {
  const colors: Record<string, string> = {
    pricing: "bg-red-100 text-red-800",
    in_hands_date: "bg-yellow-100 text-yellow-800",
    shipping: "bg-blue-100 text-blue-800",
    printing: "bg-purple-100 text-purple-800",
    artwork_proofing: "bg-green-100 text-green-800",
    oos: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
  };
  return colors[type] || colors.other;
}

function getResponsiblePartyBadge(party: string): string {
  const colors: Record<string, string> = {
    customer: "bg-blue-100 text-blue-800",
    vendor: "bg-yellow-100 text-yellow-800",
    lsd: "bg-red-100 text-red-800",
  };
  return colors[party] || colors.lsd;
}

export function useErrors(): UseErrorsReturn {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Use sample data
  const errors = sampleErrors;
  const isLoading = false;

  // Calculate statistics
  const totalErrors = errors.length;
  const resolvedErrors = errors.filter((e) => e.isResolved).length;
  const unresolvedErrors = totalErrors - resolvedErrors;
  const totalCost = errors.reduce(
    (sum, e) => sum + parseFloat(e.costToLsd || "0"),
    0
  );

  // Chart data
  const errorsByType = errors.reduce((acc, error) => {
    acc[error.errorType] = (acc[error.errorType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const errorsByParty = errors.reduce((acc, error) => {
    acc[error.responsibleParty] = (acc[error.responsibleParty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(errorsByType).map(([name, value]) => ({
    name: formatErrorType(name),
    value,
  }));

  const partyChartData = Object.entries(errorsByParty).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })
  );

  const costData = Object.entries(errorsByParty).map(([party]) => ({
    party: party.charAt(0).toUpperCase() + party.slice(1),
    cost: errors
      .filter((e) => e.responsibleParty === party)
      .reduce((sum, e) => sum + parseFloat(e.costToLsd || "0"), 0),
  }));

  // Mutations
  const _create = useCreateError();
  const createErrorMutation = {
    ..._create,
    mutate: (data: InsertError) =>
      _create.mutate(data as unknown as Record<string, unknown>, {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          toast({ title: "Error Created", description: "Error has been successfully created." });
        },
        onError: () =>
          toast({ title: "Error", description: "Failed to create error.", variant: "destructive" }),
      }),
  };

  const _update = useUpdateError();
  const updateErrorMutation = {
    ..._update,
    mutate: (data: { id: string; updates: Partial<InsertError> }) =>
      _update.mutate(
        { id: data.id, data: data.updates as unknown as Record<string, unknown> },
        {
          onSuccess: () => {
            setSelectedError(null);
            toast({ title: "Error Updated", description: "Error has been successfully updated." });
          },
          onError: () =>
            toast({ title: "Error", description: "Failed to update error.", variant: "destructive" }),
        },
      ),
  };

  const _resolve = useResolveError();
  const resolveErrorMutation = {
    ..._resolve,
    mutate: (errorId: string) =>
      _resolve.mutate(errorId, {
        onSuccess: () =>
          toast({ title: "Error Resolved", description: "Error has been marked as resolved." }),
        onError: () =>
          toast({ title: "Error", description: "Failed to resolve error.", variant: "destructive" }),
      }),
  };

  const form = useForm<InsertError>({
    resolver: zodResolver(insertErrorSchema.omit({ createdBy: true })),
    defaultValues: {
      errorType: "other",
      responsibleParty: "lsd",
      resolution: "other",
      costToLsd: "0",
      isResolved: false,
    },
  });

  const onSubmit = (data: InsertError) => {
    if (selectedError) {
      updateErrorMutation.mutate({ id: selectedError.id, updates: data });
    } else {
      createErrorMutation.mutate(data);
    }
  };

  const handleEdit = (error: Error) => {
    setSelectedError(error);
    form.reset({
      projectNumber: error.projectNumber,
      errorType: error.errorType as any,
      additionalNotes: error.additionalNotes,
      responsibleParty: error.responsibleParty as any,
      costToLsd: error.costToLsd,
      orderRep: error.orderRep,
      productionRep: error.productionRep,
      isResolved: error.isResolved,
    });
    setIsCreateModalOpen(true);
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedError,
    setSelectedError,
    isLoading,
    errors,
    totalErrors,
    resolvedErrors,
    unresolvedErrors,
    totalCost,
    typeChartData,
    partyChartData,
    costData,
    COLORS,
    form,
    onSubmit,
    createErrorMutation,
    updateErrorMutation,
    resolveErrorMutation,
    formatErrorType,
    formatResponsibleParty,
    getErrorTypeBadge,
    getResponsiblePartyBadge,
    handleEdit,
  };
}
