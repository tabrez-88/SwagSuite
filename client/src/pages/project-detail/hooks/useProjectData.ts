import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Order, OrderItemLine, OrderAdditionalCharge, OrderShipment, CustomerPortalToken } from "@shared/schema";
import { determineBusinessStage, type DeterminedStage } from "@/lib/businessStages";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProjectActivity {
  id: string;
  orderId: string;
  userId: string;
  activityType: string;
  content: string;
  metadata: any;
  mentionedUsers: string[];
  isSystemGenerated: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Communication {
  id: string;
  orderId: string;
  userId: string;
  communicationType: string;
  direction: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  metadata: any;
  sentAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const statusColorMap: Record<string, string> = {
  quote: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const statusDisplayMap: Record<string, string> = {
  quote: "Quote",
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function useProjectData(orderId: string | null | undefined) {
  const enabled = !!orderId;

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
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
    queryKey: [`/api/orders/${orderId}/invoice`],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/invoice`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
    enabled,
    retry: false,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled: enabled && !!order,
  });

  const { data: orderItems = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: enabled && !!order,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: allArtworkItems = {} } = useQuery<Record<string, any[]>>({
    queryKey: [`/api/orders/${orderId}/all-artworks`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};
      const artworksByItem: Record<string, any[]> = {};
      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/order-items/${item.id}/artworks`);
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
    queryKey: [`/api/projects/${orderId}/activities`],
    enabled: enabled && !!order,
  });

  const { data: clientCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${orderId}/communications`, { type: "client_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/communications?type=client_email`);
      if (!response.ok) throw new Error("Failed to fetch client communications");
      return response.json();
    },
    enabled: enabled && !!order,
  });

  const { data: vendorCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${orderId}/communications`, { type: "vendor_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/communications?type=vendor_email`);
      if (!response.ok) throw new Error("Failed to fetch vendor communications");
      return response.json();
    },
    enabled: enabled && !!order,
  });

  const { data: approvals = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/approvals`],
    enabled: enabled && !!order,
  });

  // Phase 2: Entity queries

  const { data: allItemLines = {} } = useQuery<Record<string, OrderItemLine[]>>({
    queryKey: [`/api/orders/${orderId}/all-item-lines`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};
      const linesByItem: Record<string, OrderItemLine[]> = {};
      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/order-items/${item.id}/lines`);
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
    queryKey: [`/api/orders/${orderId}/all-item-charges`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};
      const chargesByItem: Record<string, OrderAdditionalCharge[]> = {};
      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/order-items/${item.id}/charges`);
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
    queryKey: [`/api/orders/${orderId}/shipments`],
    enabled: enabled && !!order,
  });

  const { data: portalTokens = [] } = useQuery<CustomerPortalToken[]>({
    queryKey: [`/api/orders/${orderId}/portal-tokens`],
    enabled: enabled && !!order,
  });

  // Project-specific queries

  const { data: quoteApprovals = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/quote-approvals`],
    enabled: enabled && !!order,
    retry: false,
  });

  const { data: vendorInvoices = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/vendor-invoices`],
    enabled: enabled && !!order,
    retry: false,
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

  const statusLabel = statusDisplayMap[(order as any)?.status] || (order as any)?.status || "";
  const statusClass = statusColorMap[(order as any)?.status] || "";
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
    // Computed values
    companyName,
    primaryContact,
    companyData,
    assignedUser,
    csrUser,
    orderVendors,
    statusLabel,
    statusClass,
    isRushOrder,
    businessStage,
  };
}
