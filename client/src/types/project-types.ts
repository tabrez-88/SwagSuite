import type {
  Order,
  OrderItem,
  OrderItemLine,
  OrderAdditionalCharge,
  OrderShipment,
  CustomerPortalToken,
  ArtworkItem,
  ArtworkCharge,
  ArtworkItemFile,
} from "@shared/schema";
import type { DeterminedStage } from "@/constants/businessStages";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

export interface ProjectActivity {
  id: string;
  orderId: string;
  userId: string;
  activityType: string;
  content: string;
  metadata: Record<string, unknown>;
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
  metadata: Record<string, unknown>;
  sentAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * OrderItem returned from `/api/projects/:id/items-with-details`. Server joins
 * product + supplier fields onto each item. The index signature is intentional:
 * joined DTOs include fields that depend on the supplier (SanMar vs SAGE etc.),
 * and we don't want every reader to branch. Use `EnrichedOrderItem` to document
 * intent; narrow at the call site when you need a specific field.
 */
export type EnrichedOrderItem = OrderItem & {
  productName?: string | null;
  productSku?: string | null;
  productImageUrl?: string | null;
  productColors?: string[] | null;
  productSizes?: string[] | null;
  productBrand?: string | null;
  productDescription?: string | null;
  productImprintMethods?: string | null;
  supplierName?: string | null;
  supplierEmail?: string | null;
  supplierPhone?: string | null;
  supplierContactPerson?: string | null;
  decoratorType?: string | null;
  decoratorId?: string | null;
  [key: string]: unknown;
};

export interface OrderVendor {
  id: string;
  vendorKey: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  role: "supplier" | "decorator";
  products: Array<{
    id: string;
    productName?: string | null;
    productSku?: string | null;
    quantity?: number | null;
    color?: string | null;
    size?: string | null;
  }>;
}

/**
 * The CRM domain has TWO Contact/Company shapes: the authoritative schema row
 * (strict, `null` for missing fields) and the CRM service DTO (optional +
 * `receiveOrderEmails`, `mailingAddress`). Sections expect the CRM DTO, so we
 * type these fields that way. Downstream consumers treat them structurally.
 */
export interface ProjectContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  receiveOrderEmails?: boolean;
  mailingAddress?: string;
  [key: string]: unknown;
}

export interface ProjectCompany {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  [key: string]: unknown;
}

export interface ProjectData {
  order: Order | undefined;
  orderLoading: boolean;
  companies: ProjectCompany[];
  contacts: ProjectContact[];
  /** Invoice endpoint returns null when no invoice exists — keep loose for now. */
  invoice: any;
  invoiceLoading: boolean;
  teamMembers: TeamMember[];
  /** EnrichedOrderItem documents the server-joined shape; we keep `any[]` at
   *  the ProjectData boundary so consumers can destructure SanMar/SAGE-specific
   *  fields without gymnastics. Prefer `EnrichedOrderItem` for new code. */
  orderItems: any[];
  allArtworkItems: Record<string, ArtworkItem[]>;
  /** Supplier rows; the shared-schema `Supplier` and the Vendor service type differ subtly — keep loose. */
  suppliers: any[];
  /** Products list can include SanMar/SAGE enrichments — loose by design. */
  allProducts: any[];
  activities: ProjectActivity[];
  clientCommunications: Communication[];
  vendorCommunications: Communication[];
  /** Artwork approvals list (joined across artwork_items + orders). */
  approvals: any[];
  allItemLines: Record<string, OrderItemLine[]>;
  allItemCharges: Record<string, OrderAdditionalCharge[]>;
  allArtworkCharges: Record<string, ArtworkCharge[]>;
  allArtworkFiles: Record<string, ArtworkItemFile[]>;
  shipments: OrderShipment[];
  shipmentsLoading: boolean;
  portalTokens: CustomerPortalToken[];
  quoteApprovals: any[];
  vendorInvoices: any[];
  serviceCharges: any[];
  companyName: string;
  primaryContact: ProjectContact | undefined;
  companyData: ProjectCompany | null;
  assignedUser: TeamMember | undefined;
  csrUser: TeamMember | undefined;
  orderVendors: OrderVendor[];
  isRushOrder: boolean;
  businessStage: DeterminedStage | undefined;
}
