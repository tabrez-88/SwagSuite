import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportKeys } from "./keys";
import * as requests from "./requests";

export function useGenerateReport() {
  return useMutation({
    mutationFn: requests.generateReport,
  });
}

export function useCreateReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; query: string; description?: string; schedule?: string }) =>
      requests.createReportTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.templates });
    },
  });
}

export function useDeleteReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requests.deleteReportTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.templates });
    },
  });
}
