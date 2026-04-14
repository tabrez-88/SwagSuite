import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { determineBusinessStage } from "@/constants/businessStages";
import { useCompanies } from "@/services/companies";
import { useContactsByCompany } from "@/services/contacts";
import { useSuppliers } from "@/services/suppliers";
import { useProducts } from "@/services/products";
import {
  useProject,
  useProjectItemsWithDetails,
  useProjectInvoice,
  useProjectActivities,
  useProjectCommunications,
  useProjectApprovals,
  useProjectShipments,
  useProjectPortalTokens,
  useProjectQuoteApprovals,
  useProjectVendorInvoices,
  useProjectServiceCharges,
} from "./queries";
import type { TeamMember, ProjectData } from "@/types/project-types";
import type { Order } from "@shared/schema";

// Which sections trigger which lazy resources.
const SECTIONS = {
  INVOICE: ["invoice", "overview"],
  ACTIVITIES: ["overview", "quote", "sales-order", "pos", "invoice", "feedback"],
  COMMUNICATIONS: ["overview", "sales-order", "pos"],
  SHIPMENTS: ["shipping", "overview", "sales-order"],
  APPROVALS: ["pos", "sales-order"],
  VENDOR_INVOICES: ["bills"],
  SERVICE_CHARGES: ["quote", "sales-order"],
  QUOTE_APPROVALS: ["quote", "sales-order"],
  PORTAL_TOKENS: ["presentation", "feedback"],
  SUPPLIERS: ["overview", "quote", "sales-order", "pos", "bills"],
  PRODUCTS: ["presentation", "quote", "sales-order"],
};

function useTeamMembers(enabled: boolean) {
  return useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled,
  });
}

/**
 * Aggregates every resource a ProjectDetail section can need. Each sub-query
 * is lazily enabled based on `activeSection` so navigating between sections
 * only fetches what's relevant. Shared resources (order, companies, team,
 * items-with-details) are fetched unconditionally once `projectId` is set.
 */
export function useProjectData(
  projectId: string | null | undefined,
  activeSection?: string,
): ProjectData {
  const enabled = !!projectId;
  const section = activeSection || "overview";
  const id = projectId as string | number;

  // Core
  const { data: order, isLoading: orderLoading } = useProject<Order>(id);
  const { data: companies = [] } = useCompanies();
  const { data: teamMembers = [] } = useTeamMembers(enabled && !!order);

  // Items bundle
  const { data: itemsWithDetails } = useProjectItemsWithDetails(id, enabled && !!order);
  const orderItems = itemsWithDetails?.items || [];
  const allItemLines = itemsWithDetails?.lines || {};
  const allItemCharges = itemsWithDetails?.charges || {};
  const allArtworkItems = itemsWithDetails?.artworks || {};
  const allArtworkCharges = itemsWithDetails?.artworkCharges || {};
  const allArtworkFiles = itemsWithDetails?.artworkFiles || {};

  // Section-dependent
  const { data: contacts = [] } = useContactsByCompany(order?.companyId ?? undefined);
  const { data: invoice, isLoading: invoiceLoading } = useProjectInvoice(
    id,
    enabled && !!order && SECTIONS.INVOICE.includes(section),
  );
  const { data: suppliers = [] } = useSuppliers();
  const { data: allProducts = [] } = useProducts<any[]>();
  const { data: activities = [] } = useProjectActivities(
    id,
    enabled && !!order && SECTIONS.ACTIVITIES.includes(section),
  );
  const { data: clientCommunications = [] } = useProjectCommunications(
    id,
    "client_email",
    enabled && !!order && SECTIONS.COMMUNICATIONS.includes(section),
  );
  const { data: vendorCommunications = [] } = useProjectCommunications(
    id,
    "vendor_email",
    enabled && !!order && SECTIONS.COMMUNICATIONS.includes(section),
  );
  const { data: approvals = [] } = useProjectApprovals(
    id,
    enabled && !!order && SECTIONS.APPROVALS.includes(section),
  );
  const { data: shipments = [], isLoading: shipmentsLoading } = useProjectShipments(
    id,
    enabled && !!order && SECTIONS.SHIPMENTS.includes(section),
  );
  const { data: portalTokens = [] } = useProjectPortalTokens(
    id,
    enabled && !!order && SECTIONS.PORTAL_TOKENS.includes(section),
  );
  const { data: quoteApprovals = [] } = useProjectQuoteApprovals(
    id,
    enabled && !!order && SECTIONS.QUOTE_APPROVALS.includes(section),
  );
  const { data: vendorInvoices = [] } = useProjectVendorInvoices(
    id,
    enabled && !!order && SECTIONS.VENDOR_INVOICES.includes(section),
  );
  const { data: serviceCharges = [] } = useProjectServiceCharges(
    id,
    enabled && !!order && SECTIONS.SERVICE_CHARGES.includes(section),
  );

  // Derived
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
    const vendorsMap = new Map<string, any>();

    orderItems.forEach((item: any) => {
      if (item.supplierId && !vendorsMap.has(item.supplierId)) {
        const supplierFromArray = suppliers.find((s: any) => s.id === item.supplierId);
        vendorsMap.set(item.supplierId, {
          id: item.supplierId,
          vendorKey: item.supplierId,
          name: item.supplierName || supplierFromArray?.name || "Unknown Vendor",
          email: item.supplierEmail || supplierFromArray?.email || "",
          phone: item.supplierPhone || supplierFromArray?.phone || "",
          contactPerson: item.supplierContactPerson || supplierFromArray?.contactPerson || "",
          role: "supplier" as const,
          products: [],
        });
      }

      if (item.decoratorType === "third_party" && item.decoratorId && item.decoratorId !== item.supplierId) {
        const decoratorKey = `decorator-${item.decoratorId}`;
        if (!vendorsMap.has(decoratorKey)) {
          const decoratorFromArray = suppliers.find((s: any) => s.id === item.decoratorId);
          vendorsMap.set(decoratorKey, {
            id: item.decoratorId,
            vendorKey: decoratorKey,
            name: decoratorFromArray?.name || "Unknown Decorator",
            email: decoratorFromArray?.email || "",
            phone: decoratorFromArray?.phone || "",
            contactPerson: decoratorFromArray?.contactPerson || "",
            role: "decorator" as const,
            products: [],
          });
        }
      }
    });

    orderItems.forEach((item: any) => {
      const product = {
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      };

      if (item.supplierId && vendorsMap.has(item.supplierId)) {
        vendorsMap.get(item.supplierId).products.push(product);
      }

      if (item.decoratorType === "third_party" && item.decoratorId) {
        const decoratorKey = `decorator-${item.decoratorId}`;
        if (vendorsMap.has(decoratorKey)) {
          vendorsMap.get(decoratorKey).products.push(product);
        }
      }
    });

    return Array.from(vendorsMap.values());
  }, [orderItems, suppliers]);

  const isRushOrder = !!(order as any)?.isRush;
  const businessStage = order ? determineBusinessStage(order) : undefined;

  return {
    order,
    orderLoading,
    // Schema-inferred Company/Contact don't include the CRM service extensions
    // (receiveOrderEmails, mailingAddress). The ProjectData shape expects the
    // looser CRM shape.
    companies: companies as ProjectData["companies"],
    contacts: contacts as ProjectData["contacts"],
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
    allItemLines,
    allItemCharges,
    allArtworkCharges,
    allArtworkFiles,
    shipments,
    shipmentsLoading,
    portalTokens,
    quoteApprovals,
    vendorInvoices,
    serviceCharges,
    companyName,
    primaryContact: primaryContact as ProjectData["primaryContact"],
    companyData: (companyData ?? null) as ProjectData["companyData"],
    assignedUser,
    csrUser,
    orderVendors,
    isRushOrder,
    businessStage,
  };
}
