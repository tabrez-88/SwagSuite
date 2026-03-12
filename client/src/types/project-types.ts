import type { Order, OrderItemLine, OrderAdditionalCharge, OrderShipment, CustomerPortalToken } from "@shared/schema";
import type { DeterminedStage } from "@/lib/businessStages";

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

export interface ProjectData {
  order: Order | undefined;
  orderLoading: boolean;
  companies: any[];
  contacts: any[];
  invoice: any;
  invoiceLoading: boolean;
  teamMembers: TeamMember[];
  orderItems: any[];
  allArtworkItems: Record<string, any[]>;
  suppliers: any[];
  allProducts: any[];
  activities: ProjectActivity[];
  clientCommunications: Communication[];
  vendorCommunications: Communication[];
  approvals: any[];
  allItemLines: Record<string, OrderItemLine[]>;
  allItemCharges: Record<string, OrderAdditionalCharge[]>;
  shipments: OrderShipment[];
  shipmentsLoading: boolean;
  portalTokens: CustomerPortalToken[];
  quoteApprovals: any[];
  vendorInvoices: any[];
  serviceCharges: any[];
  companyName: string;
  primaryContact: any;
  companyData: any;
  assignedUser: TeamMember | undefined;
  csrUser: TeamMember | undefined;
  orderVendors: any[];
  isRushOrder: any;
  businessStage: DeterminedStage | undefined;
}
