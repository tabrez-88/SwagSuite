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

// Sections that need specific data
const SECTIONS_NEEDING_INVOICE = ["invoice", "overview"];
const SECTIONS_NEEDING_ACTIVITIES = ["overview", "quote", "sales-order", "pos", "invoice", "feedback"];
const SECTIONS_NEEDING_COMMUNICATIONS = ["overview", "sales-order", "pos"];
const SECTIONS_NEEDING_SHIPMENTS = ["shipping", "overview", "sales-order"];
const SECTIONS_NEEDING_APPROVALS = ["pos", "sales-order"];
const SECTIONS_NEEDING_VENDOR_INVOICES = ["bills"];
const SECTIONS_NEEDING_SERVICE_CHARGES = ["quote", "sales-order"];
const SECTIONS_NEEDING_QUOTE_APPROVALS = ["quote", "sales-order"];
const SECTIONS_NEEDING_PORTAL_TOKENS = ["presentation", "feedback"];
const SECTIONS_NEEDING_SUPPLIERS = ["overview", "quote", "sales-order", "pos", "bills"];
const SECTIONS_NEEDING_PRODUCTS = ["presentation", "quote", "sales-order"];

export function useProjectData(projectId: string | null | undefined, activeSection?: string): ProjectData {
  const enabled = !!projectId;
  const section = activeSection || "overview";

  // ── Core queries (always needed) ──

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/projects/${projectId}`],
    enabled,
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: enabled && !!order,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled: enabled && !!order,
  });

  // ── Batch endpoint: items + lines + charges + artwork in 1 request ──

  const { data: itemsWithDetails } = useQuery<{
    items: any[];
    lines: Record<string, OrderItemLine[]>;
    charges: Record<string, OrderAdditionalCharge[]>;
    artworks: Record<string, any[]>;
  }>({
    queryKey: [`/api/projects/${projectId}/items-with-details`],
    enabled: enabled && !!order,
  });

  const orderItems = itemsWithDetails?.items || [];
  const allItemLines = itemsWithDetails?.lines || {};
  const allItemCharges = itemsWithDetails?.charges || {};
  const allArtworkItems = itemsWithDetails?.artworks || {};

  // ── Section-specific queries (lazy loaded) ──

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
    enabled: enabled && !!order && SECTIONS_NEEDING_INVOICE.includes(section),
    retry: false,
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: enabled && !!order && SECTIONS_NEEDING_SUPPLIERS.includes(section),
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: enabled && !!order && SECTIONS_NEEDING_PRODUCTS.includes(section),
  });

  const { data: activities = [] } = useQuery<ProjectActivity[]>({
    queryKey: [`/api/projects/${projectId}/activities`],
    enabled: enabled && !!order && SECTIONS_NEEDING_ACTIVITIES.includes(section),
  });

  const { data: clientCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/projects/${projectId}/communications`, { type: "client_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/communications?type=client_email`);
      if (!response.ok) throw new Error("Failed to fetch client communications");
      return response.json();
    },
    enabled: enabled && !!order && SECTIONS_NEEDING_COMMUNICATIONS.includes(section),
  });

  const { data: vendorCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/projects/${projectId}/communications`, { type: "vendor_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/communications?type=vendor_email`);
      if (!response.ok) throw new Error("Failed to fetch vendor communications");
      return response.json();
    },
    enabled: enabled && !!order && SECTIONS_NEEDING_COMMUNICATIONS.includes(section),
  });

  const { data: approvals = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/approvals`],
    enabled: enabled && !!order && SECTIONS_NEEDING_APPROVALS.includes(section),
  });

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery<OrderShipment[]>({
    queryKey: [`/api/projects/${projectId}/shipments`],
    enabled: enabled && !!order && SECTIONS_NEEDING_SHIPMENTS.includes(section),
  });

  const { data: portalTokens = [] } = useQuery<CustomerPortalToken[]>({
    queryKey: [`/api/projects/${projectId}/portal-tokens`],
    enabled: enabled && !!order && SECTIONS_NEEDING_PORTAL_TOKENS.includes(section),
  });

  const { data: quoteApprovals = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/quote-approvals`],
    enabled: enabled && !!order && SECTIONS_NEEDING_QUOTE_APPROVALS.includes(section),
    retry: false,
  });

  const { data: vendorInvoices = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/vendor-invoices`],
    enabled: enabled && !!order && SECTIONS_NEEDING_VENDOR_INVOICES.includes(section),
    retry: false,
  });

  const { data: serviceCharges = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/service-charges`],
    enabled: enabled && !!order && SECTIONS_NEEDING_SERVICE_CHARGES.includes(section),
  });

  // ── Computed values ──

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
