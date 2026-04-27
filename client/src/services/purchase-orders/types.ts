export interface PurchaseOrderEntity {
  id: string;
  orderId: string;
  poNumber: string;
  vendorId: string;
  vendorRole: "supplier" | "decorator";
  groupKey: string;
  currentStageId: string | null;
  documentId: string | null;
  confirmationToken: string | null;
  confirmationTokenExpiresAt: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  billedAt: string | null;
  closedAt: string | null;
  vendorNotes: string | null;
  internalNotes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Populated from junction
  items?: string[];
}

export interface CreatePurchaseOrderData {
  poNumber: string;
  vendorId: string;
  vendorRole?: "supplier" | "decorator";
  groupKey: string;
  currentStageId?: string | null;
  documentId?: string | null;
  vendorNotes?: string | null;
  internalNotes?: string | null;
  orderItemIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdatePurchaseOrderData {
  currentStageId?: string | null;
  documentId?: string | null;
  vendorNotes?: string | null;
  internalNotes?: string | null;
  metadata?: Record<string, unknown>;
  orderItemIds?: string[];
}

export interface ConfirmationResult {
  token: string;
  portalUrl: string;
  expiresAt: string;
}
