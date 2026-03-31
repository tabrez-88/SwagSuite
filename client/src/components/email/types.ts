export interface EmailContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  isPrimary?: boolean;
  title?: string | null;
  receiveOrderEmails?: boolean;
}

export interface EmailAttachment {
  id: string;
  fileName: string;
  cloudinaryUrl: string;
  mimeType?: string | null;
}

export interface EmailFormData {
  to: string;
  toName: string;
  from: string;
  fromName: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  selectedContactIds: Set<string>;
  attachments: EmailAttachment[];
}

export type EmailFormField = keyof Omit<EmailFormData, "selectedContactIds">;
