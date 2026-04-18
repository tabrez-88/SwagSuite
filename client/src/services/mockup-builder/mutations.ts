import { useMutation } from "@tanstack/react-query";
import * as requests from "./requests";

export function useSearchMockupProducts() {
  return useMutation({ mutationFn: requests.searchMockupProducts });
}

export function useDownloadMockups() {
  return useMutation({ mutationFn: requests.downloadMockups });
}

export function useEmailMockups() {
  return useMutation({ mutationFn: requests.emailMockups });
}

export function useGenerateAiTemplates() {
  return useMutation({ mutationFn: requests.generateAiTemplates });
}
