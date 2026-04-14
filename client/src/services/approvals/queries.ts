import { useQuery } from "@tanstack/react-query";
import { approvalKeys } from "./keys";
import * as requests from "./requests";
import { fetchPublicPresentation } from "./requests";

export function useClientApproval<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: approvalKeys.client(token ?? ""),
    enabled: !!token,
    retry: false,
  });
}

export function usePoConfirmation<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: approvalKeys.po(token ?? ""),
    enabled: !!token,
    retry: false,
  });
}

export function useArtworkApproval<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: approvalKeys.artwork(token ?? ""),
    enabled: !!token,
    retry: false,
  });
}

export function useVendorApprovalRequests<T = any[]>() {
  return useQuery<T>({
    queryKey: approvalKeys.vendorApprovals,
    queryFn: () => requests.fetchVendorApprovalRequests<T>(),
  });
}

export function usePublicPresentation<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: approvalKeys.publicPresentation(token ?? ""),
    queryFn: () => fetchPublicPresentation<T>(token!),
    enabled: !!token,
    retry: false,
  });
}
