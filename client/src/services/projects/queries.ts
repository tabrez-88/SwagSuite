import { useQuery } from "@tanstack/react-query";
import type {
  OrderItemLine,
  OrderAdditionalCharge,
  OrderShipment,
  CustomerPortalToken,
} from "@shared/schema";
import { projectKeys } from "./keys";
import type { Project } from "./types";
import type { ProjectActivity, Communication } from "@/types/project-types";

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
  items: any[];
  lines: Record<string, OrderItemLine[]>;
  charges: Record<string, OrderAdditionalCharge[]>;
  artworks: Record<string, any[]>;
  artworkCharges: Record<string, any[]>;
  artworkFiles: Record<string, any[]>;
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

export function useProjectInvoice<T = any>(projectId: string | number, enabled = true) {
  return useQuery<T>({
    queryKey: projectKeys.invoice(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/invoice`, { credentials: "include" });
      if (!res.ok) return null as T;
      return res.json();
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
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/communications?type=${type}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type} communications`);
      return res.json();
    },
    enabled: !!projectId && enabled,
  });
}

export function useProjectApprovals<T = any[]>(projectId: string | number, enabled = true) {
  return useQuery<T>({
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

export function useProjectQuoteApprovals<T = any[]>(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<T>({
    queryKey: projectKeys.approvals(projectId),
    enabled: !!projectId && enabled,
    retry: false,
  });
}

export function useProjectVendorInvoices<T = any[]>(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<T>({
    queryKey: projectKeys.vendorInvoices(projectId),
    enabled: !!projectId && enabled,
    retry: false,
  });
}

export function useProjectServiceCharges<T = any[]>(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<T>({
    queryKey: projectKeys.serviceCharges(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectProductComments(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<Record<string, any[]>>({
    queryKey: projectKeys.productComments(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectDocuments<T = any[]>(
  projectId: string | number,
  enabled = true,
) {
  return useQuery<T>({
    queryKey: projectKeys.documents(projectId),
    enabled: !!projectId && enabled,
  });
}
