export interface SendCommunicationInput {
  communicationType: "vendor_email" | "client_email" | "internal";
  subject: string;
  body: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ fileName: string; url: string }>;
  [key: string]: unknown;
}

export interface SendGenericEmailInput {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}
