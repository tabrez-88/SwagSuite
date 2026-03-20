export interface VendorApprovalRequest {
  id: string;
  supplierId: string;
  productId?: string;
  orderId?: string;
  requestedBy: string;
  reason?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  // Enriched data
  supplier?: {
    id: string;
    name: string;
  };
  requestedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
  reviewedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
  product?: {
    id: string;
    name: string;
  };
}
