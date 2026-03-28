export interface DocumentEmailData {
  type: 'client' | 'vendor';
  document: any;
  to: string;
  toName: string;
  subject: string;
  body: string;
  vendorId?: string;
  updateStatusOnSend?: 'pending_approval';
}

export interface DocumentsTabProps {
  projectId: string;
  order: any;
  orderItems: any[];
  orderVendors: any[];
  companyName: string;
  primaryContact: any;
  getEditedItem: (id: string, item: any) => any;
  calculateItemTotals: (item: any) => any;
  onSendEmail?: (data: DocumentEmailData) => void;
  allArtworkItems?: Record<string, any[]>;
}
