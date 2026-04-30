import { useMutation } from "@tanstack/react-query";
import * as requests from "./requests";

export function useGenerateReport() {
  return useMutation({
    mutationFn: requests.generateReport,
  });
}
