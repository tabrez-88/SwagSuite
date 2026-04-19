import { useQuery } from "@tanstack/react-query";
import type {
  OrderItemLine,
  OrderAdditionalCharge,
  OrderShipment,
  CustomerPortalToken,
  ArtworkItem,
  ArtworkCharge,
  ArtworkItemFile,
  ArtworkApproval,
  Invoice,
  QuoteApproval,
  VendorInvoice,
  OrderServiceCharge,
  GeneratedDocument,
} from "@shared/schema";
import { projectKeys } from "./keys";
import type { Project } from "./types";
import type { ProjectActivity, Communication, EnrichedOrderItem } from "@/types/project-types";
import * as requests from "./requests";

// ---- Project-level ----

export function useProjects<T = Project[]>() {
  return useQuery<T>({ queryKey: projectKeys.all });
}

export function useProject<T = Project>(projectId: string | number) {
  return useQuery<T>({
    queryKey: projectKeys.detail(projectId),
    enabled: !!projectId,
  });
}

// ---- Items / lines / charges / artwork batch ----

export interface ItemsWithDetailsResponse {
  items: EnrichedOrderItem[];
  lines: Record<string, OrderItemLine[]>;
  charges: Record<string, OrderAdditionalCharge[]>;
  artworks: Record<string, ArtworkItem[]>;
  artworkCharges: Record<string, ArtworkCharge[]>;
  artworkFiles: Record<string, ArtworkItemFile[]>;
}

export function useProjectItemsWithDetails(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<ItemsWithDetailsResponse>({
    queryKey: projectKeys.itemsWithDetails(projectId),
    enabled: !!projectId && enabled,
  });
}

// ---- Section-specific resources ----

export function useProjectInvoice(projectId: string | number, enabled = true) {
  return useQuery<Invoice | null>({
    queryKey: projectKeys.invoice(projectId),
    queryFn: async () => {
      try {
        return await requests.fetchProjectInvoice(projectId);
      } catch {
        return null;
      }
    },
    enabled: !!projectId && enabled,
    retry: false,
  });
}

export function useProjectActivities(projectId: string | number, enabled = true) {
  return useQuery<ProjectActivity[]>({
    queryKey: projectKeys.activities(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectCommunications(
  projectId: string | number,
  type: "client_email" | "vendor_email",
  enabled = true,
) {
  return useQuery<Communication[]>({
    queryKey: projectKeys.communications(projectId, type),
    queryFn: () => requests.fetchProjectCommunications(projectId, type),
    enabled: !!projectId && enabled,
  });
}

export function useProjectApprovals(projectId: string | number, enabled = true) {
  return useQuery<ArtworkApproval[]>({
    queryKey: [`/api/projects/${projectId}/approvals`] as const,
    enabled: !!projectId && enabled,
  });
}

export function useProjectShipments(projectId: string | number, enabled = true) {
  return useQuery<OrderShipment[]>({
    queryKey: projectKeys.shipments(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectPortalTokens(projectId: string | number, enabled = true) {
  return useQuery<CustomerPortalToken[]>({
    queryKey: projectKeys.portalTokens(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectQuoteApprovals(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<QuoteApproval[]>({
    queryKey: projectKeys.approvals(projectId),
    enabled: !!projectId && enabled,
    retry: false,
  });
}

export function useProjectVendorInvoices(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<VendorInvoice[]>({
    queryKey: projectKeys.vendorInvoices(projectId),
    enabled: !!projectId && enabled,
    retry: false,
  });
}

export function useProjectServiceCharges(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<OrderServiceCharge[]>({
    queryKey: projectKeys.serviceCharges(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectProductComments(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<Record<string, ProjectActivity[]>>({
    queryKey: projectKeys.productComments(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectDocuments(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<GeneratedDocument[]>({
    queryKey: projectKeys.documents(projectId),
    enabled: !!projectId && enabled,
  });
}
