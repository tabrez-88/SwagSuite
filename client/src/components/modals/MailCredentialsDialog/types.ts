export interface MailCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface MailFormData {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword: string;
  isPrimary: boolean;
  useDefaultForCompose: boolean;
  hideNameOnSend: boolean;
}
