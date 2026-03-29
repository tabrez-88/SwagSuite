export interface ArtworkDetail {
  id: string;
  name: string;
  artworkType?: string;
  location?: string;
  color?: string;
  size?: string;
  status?: string;
  filePath?: string;
  fileName?: string;
  proofFilePath?: string;
  proofFileName?: string;
  notes?: string;
}

export interface ApprovalHistoryItem {
  id: string;
  status: string;
  approvedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  clientName?: string;
  sentAt?: string;
  createdAt?: string;
}

export interface ApprovalData {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  approvalToken: string;
  status: "pending" | "approved" | "rejected" | "declined";
  artworkUrl?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  clientName?: string;
  sentAt?: string;
  company: { name: string };
  order: { orderNumber: string; companyName: string };
  orderItem: {
    productName: string;
    productSku?: string;
    quantity: number;
    color?: string;
    size?: string;
    imageUrl?: string;
  };
  artworkFile?: { fileName: string; filePath: string; originalName: string };
  artworkDetails?: ArtworkDetail[];
  approvalHistory?: ApprovalHistoryItem[];
}
