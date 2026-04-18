import { useMutation, useQueryClient } from "@tanstack/react-query";
import { imprintOptionKeys } from "./keys";
import * as requests from "./requests";

export function useCreateImprintOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requests.createImprintOption,
    onSuccess: () => qc.invalidateQueries({ queryKey: imprintOptionKeys.all }),
  });
}

export function useUpdateImprintOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<import("./types").ImprintOption, "label" | "displayOrder" | "isActive">> }) =>
      requests.updateImprintOption(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: imprintOptionKeys.all }),
  });
}

export function useDeleteImprintOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requests.deleteImprintOption,
    onSuccess: () => qc.invalidateQueries({ queryKey: imprintOptionKeys.all }),
  });
}

export function useSubmitImprintSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requests.submitImprintSuggestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/imprint-option-suggestions"] });
    },
  });
}

export function useApproveImprintSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requests.approveImprintSuggestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/imprint-option-suggestions"] });
      qc.invalidateQueries({ queryKey: imprintOptionKeys.all });
    },
  });
}

export function useRejectImprintSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      requests.rejectImprintSuggestion(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/imprint-option-suggestions"] });
    },
  });
}
