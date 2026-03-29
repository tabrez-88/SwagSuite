import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Order, OrderItemLine, OrderAdditionalCharge, OrderShipment, CustomerPortalToken } from "@shared/schema";
import { determineBusinessStage } from "@/constants/businessStages";
import {
  type TeamMember,
  type ProjectActivity,
  type Communication,
  type ProjectData,
} from "@/types/project-types";

// Re-export types for backward compatibility
export { type TeamMember, type ProjectActivity, type Communication, type ProjectData };

export function useProjectData(projectId: string | null | undefined): ProjectData {
  const enabled = !!projectId;

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/projects/${projectId}`],
    enabled,
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: enabled && !!order,
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts`, { companyId: order?.companyId }],
    queryFn: async () => {
      if (!order?.companyId) return [];
      const response = await fetch(`/api/contacts?companyId=${order.companyId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: enabled && !!order?.companyId,
  });

  const { data: invoice, isLoading: invoiceLoading } = useQuery<any>({
    queryKey: [`/api/projects/${projectId}/invoice`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/invoice`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: enabled && !!order,
    retry: false,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled: enabled && !!order,
  });

  const { data: orderItems = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/items`],
    enabled: enabled && !!order,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: allArtworkItems = {} } = useQuery<Record<string, any[]>>({
    queryKey: [`/api/projects/${projectId}/all-artworks`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};
      const artworksByItem: Record<string, any[]> = {};
      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/project-items/${item.id}/artworks`);
            if (response.ok) {
              artworksByItem[item.id] = await response.json();
            } else {
              artworksByItem[item.id] = [];
            }
          } catch {
            artworksByItem[item.id] = [];
          }
        }),
      );
      return artworksByItem;
    },
    enabled: enabled && !!orderItems && orderItems.length > 0,
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: enabled && !!order,
    staleTime: 0,
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: enabled && !!order,
    staleTime: 0,
  });

  const { data: activities = [] } = useQuery<ProjectActivity[]>({
    queryKey: [`/api/projects/${projectId}/activities`],
    enabled: enabled && !!order,
  });

  const { data: clientCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/projects/${projectId}/communications`, { type: "client_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/communications?type=client_email`);
      if (!response.ok) throw new Error("Failed to fetch client communications");
      return response.json();
    },
    enabled: enabled && !!order,
  });

  const { data: vendorCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/projects/${projectId}/communications`, { type: "vendor_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/communications?type=vendor_email`);
      if (!response.ok) throw new Error("Failed to fetch vendor communications");
      return response.json();
    },
    enabled: enabled && !!order,
  });

  const { data: approvals = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/approvals`],
    enabled: enabled && !!order,
  });

  // Phase 2: Entity queries

  const { data: allItemLines = {} } = useQuery<Record<string, OrderItemLine[]>>({
    queryKey: [`/api/projects/${projectId}/all-item-lines`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};
      const linesByItem: Record<string, OrderItemLine[]> = {};
      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/project-items/${item.id}/lines`);
            if (response.ok) {
              linesByItem[item.id] = await response.json();
            } else {
              linesByItem[item.id] = [];
            }
          } catch {
            linesByItem[item.id] = [];
          }
        }),
      );
      return linesByItem;
    },
    enabled: enabled && !!orderItems && orderItems.length > 0,
  });

  const { data: allItemCharges = {} } = useQuery<Record<string, OrderAdditionalCharge[]>>({
    queryKey: [`/api/projects/${projectId}/all-item-charges`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};
      const chargesByItem: Record<string, OrderAdditionalCharge[]> = {};
      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/project-items/${item.id}/charges`);
            if (response.ok) {
              chargesByItem[item.id] = await response.json();
            } else {
              chargesByItem[item.id] = [];
            }
          } catch {
            chargesByItem[item.id] = [];
          }
        }),
      );
      return chargesByItem;
    },
    enabled: enabled && !!orderItems && orderItems.length > 0,
  });

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery<OrderShipment[]>({
    queryKey: [`/api/projects/${projectId}/shipments`],
    enabled: enabled && !!order,
  });

  const { data: portalTokens = [] } = useQuery<CustomerPortalToken[]>({
    queryKey: [`/api/projects/${projectId}/portal-tokens`],
    enabled: enabled && !!order,
  });

  // Project-specific queries

  const { data: quoteApprovals = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/quote-approvals`],
    enabled: enabled && !!order,
    retry: false,
  });

  const { data: vendorInvoices = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/vendor-invoices`],
    enabled: enabled && !!order,
    retry: false,
  });

  const { data: serviceCharges = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/service-charges`],
    enabled: enabled && !!order,
  });

  // Computed values

  const companyName = order?.companyId
    ? companies.find((c: any) => c.id === order.companyId)?.name || "Unknown Company"
    : "Individual Client";

  const primaryContact = contacts.find((c: any) => c.isPrimary) || contacts[0];

  const companyData = order?.companyId
    ? companies.find((c: any) => c.id === order.companyId)
    : null;

  const assignedUser = teamMembers.find((u: any) => u.id === (order as any)?.assignedUserId);
  const csrUser = teamMembers.find((u: any) => u.id === (order as any)?.csrUserId);

  const orderVendors = useMemo(() => {
    const vendorsMap = new Map();
    orderItems.forEach((item: any) => {
      if (item.supplierId && !vendorsMap.has(item.supplierId)) {
        const supplierFromArray = suppliers.find((s: any) => s.id === item.supplierId);
        vendorsMap.set(item.supplierId, {
          id: item.supplierId,
          name: item.supplierName || supplierFromArray?.name || "Unknown Vendor",
          email: item.supplierEmail || supplierFromArray?.email || "",
          phone: item.supplierPhone || supplierFromArray?.phone || "",
          contactPerson: item.supplierContactPerson || supplierFromArray?.contactPerson || "",
          products: [],
        });
      }
    });
    orderItems.forEach((item: any) => {
      if (item.supplierId && vendorsMap.has(item.supplierId)) {
        vendorsMap.get(item.supplierId).products.push({
          id: item.id,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        });
      }
    });
    return Array.from(vendorsMap.values());
  }, [orderItems, suppliers]);

  const isRushOrder = (order as any)?.isRush;
  const businessStage = order ? determineBusinessStage(order) : undefined;

  return {
    order,
    orderLoading,
    companies,
    contacts,
    invoice,
    invoiceLoading,
    teamMembers,
    orderItems,
    allArtworkItems,
    suppliers,
    allProducts,
    activities,
    clientCommunications,
    vendorCommunications,
    approvals,
    // Phase 2 entities
    allItemLines,
    allItemCharges,
    shipments,
    shipmentsLoading,
    portalTokens,
    // Project-specific
    quoteApprovals,
    vendorInvoices,
    serviceCharges,
    // Computed values
    companyName,
    primaryContact,
    companyData,
    assignedUser,
    csrUser,
    orderVendors,
    isRushOrder,
    businessStage,
  };
}
