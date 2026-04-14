export type { SsActivewearProduct } from "@shared/schema";

export interface SsBrand {
  id: string;
  name: string;
}

export interface SsCredentials {
  accountNumber: string;
  apiKey: string;
}

export interface SsImportInput extends SsCredentials {
  styleFilter?: string;
}
