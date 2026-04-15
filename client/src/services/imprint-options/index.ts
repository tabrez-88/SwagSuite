import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type ImprintOptionType = "location" | "method";

export interface ImprintOption {
  id: string;
  type: ImprintOptionType;
  value: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImprintOptionSuggestion {
  id: string;
  type: ImprintOptionType;
  label: string;
  normalizedLabel: string;
  suggestedBy: string | null;
  suggestedFromOrderId: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedOptionId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export const imprintOptionKeys = {
  all: ["/api/imprint-options"] as const,
  byType: (type: ImprintOptionType, includeInactive = false) =>
    [
      "/api/imprint-options",
      { type, ...(includeInactive ? { includeInactive: "true" } : {}) },
    ] as const,
  suggestions: (status?: string) =>
    ["/api/imprint-option-suggestions", status ? { status } : {}] as const,
  pendingCount: ["/api/imprint-option-suggestions/pending-count"] as const,
};

export function useImprintOptions(type: ImprintOptionType, includeInactive = false) {
  return useQuery<ImprintOption[]>({
    queryKey: imprintOptionKeys.byType(type, includeInactive),
    queryFn: async () => {
      const qs = new URLSearchParams({ type });
      if (includeInactive) qs.set("includeInactive", "true");
      const res = await apiRequest("GET", `/api/imprint-options?${qs.toString()}`);
      return res.json();
    },
  });
}

export function useCreateImprintOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: ImprintOptionType;
      label: string;
      value?: string;
      displayOrder?: number;
      isActive?: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/imprint-options", data);
      return res.json() as Promise<ImprintOption>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: imprintOptionKeys.all }),
  });
}

export function useUpdateImprintOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<ImprintOption, "label" | "displayOrder" | "isActive">>;
    }) => {
      const res = await apiRequest("PATCH", `/api/imprint-options/${id}`, data);
      return res.json() as Promise<ImprintOption>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: imprintOptionKeys.all }),
  });
}

export function useDeleteImprintOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/imprint-options/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: imprintOptionKeys.all }),
  });
}

export function useImprintSuggestions(status?: string) {
  return useQuery<ImprintOptionSuggestion[]>({
    queryKey: imprintOptionKeys.suggestions(status),
    queryFn: async () => {
      const qs = status ? `?status=${status}` : "";
      const res = await apiRequest("GET", `/api/imprint-option-suggestions${qs}`);
      return res.json();
    },
  });
}

export function useImprintSuggestionPendingCount() {
  return useQuery<{ count: number }>({
    queryKey: imprintOptionKeys.pendingCount,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        "/api/imprint-option-suggestions/pending-count",
      );
      return res.json();
    },
  });
}

export function useSubmitImprintSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: ImprintOptionType;
      label: string;
      suggestedFromOrderId?: string;
      note?: string;
    }) => {
      const res = await apiRequest("POST", "/api/imprint-option-suggestions", data);
      return res.json() as Promise<{
        suggestion: ImprintOptionSuggestion | null;
        duplicate: boolean;
        reason?: "already_option" | "pending_duplicate";
        existingOption?: ImprintOption;
      }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/imprint-option-suggestions"] });
    },
  });
}

export function useApproveImprintSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(
        "POST",
        `/api/imprint-option-suggestions/${id}/approve`,
      );
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/imprint-option-suggestions"] });
      qc.invalidateQueries({ queryKey: imprintOptionKeys.all });
    },
  });
}

export function useRejectImprintSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/imprint-option-suggestions/${id}/reject`,
        { note },
      );
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/imprint-option-suggestions"] });
    },
  });
}
