import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportKeys } from "./keys";
import * as requests from "./requests";

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.generateReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.recent }),
  });
}

export function useSaveReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.saveReportTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.templates }),
  });
}

export function useRunReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.runReportTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.recent }),
  });
}
