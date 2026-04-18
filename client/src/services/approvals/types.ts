export interface ApproveInput {
  notes?: string;
}

export interface DeclineInput {
  reason: string;
}

export interface ReviewVendorApprovalInput {
  status: string;
  reviewNotes?: string;
}

export interface PresentationCommentInput {
  orderItemId: number;
  content: string;
  clientName: string;
}
