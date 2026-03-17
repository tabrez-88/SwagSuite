export interface EmailContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  isPrimary?: boolean;
  title?: string | null;
  receiveOrderEmails?: boolean;
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
}

export type EmailFormField = keyof Omit<EmailFormData, "selectedContactIds">;
