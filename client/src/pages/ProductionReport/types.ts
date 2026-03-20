export interface POReportRow {
  documentId: string;
  documentNumber: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  fileUrl: string;
  documentStatus: string;
  sentAt: string;
  metadata: any;
  createdAt: string;
  orderNumber: string;
  inHandsDate: string;
  supplierInHandsDate: string;
  eventDate: string;
  nextActionDate: string;
  nextActionType: string;
  nextActionNotes: string;
  isFirm: boolean;
  isRush: boolean;
  salesOrderStatus: string;
  assignedUserId: string;
  csrUserId: string;
  companyName: string;
  companyId: string;
  assignedUserName: string;
  assignedUserImage: string | null;
  csrUserName: string;
  currentStage: string;
  stagesCompleted: string[];
  // Enriched
  poStage: string;
  poStatus: string;
  totalCost: number;
  itemCount: number;
  proofItems: Array<{ status: string; name: string }>;
  shipments: Array<{ carrier: string; trackingNumber: string; status: string; shipDate: string }>;
}

export interface POReportResponse {
  data: POReportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
