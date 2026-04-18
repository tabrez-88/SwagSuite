export type DocumentType = "quote" | "sales_order" | "purchase_order" | "invoice";

export type POStage =
  | "created"
  | "submitted"
  | "confirmed"
  | "shipped"
  | "ready_for_billing"
  | "billed"
  | "closed";

export type POStatus = "ok" | "follow_up" | "problem";

export interface UpdateDocumentMetaInput {
  status?: string;
  sentAt?: string;
  metadata?: {
    poStage?: POStage;
    poStatus?: POStatus;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
