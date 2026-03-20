export interface QuoteApprovalData {
  id: string;
  orderId: string;
  approvalToken: string;
  status: "pending" | "approved" | "declined";
  clientEmail?: string;
  clientName?: string;
  quoteTotal?: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  approvalNotes?: string;
  pdfPath?: string;
  orderNumber?: string;
  orderTotal?: string;
  companyName?: string;
  inHandsDate?: string;
  documentType?: string;
  items: Array<{
    id: string;
    productName?: string;
    productSku?: string;
    productImageUrl?: string;
    quantity: number;
    unitPrice?: string;
    totalPrice?: string;
    color?: string;
    size?: string;
  }>;
}
