import { Building2, User, Mail } from "lucide-react";

interface ProjectInfoBarProps {
  companyName: string;
  primaryContact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

export default function ProjectInfoBar({ companyName, primaryContact }: ProjectInfoBarProps) {
  const contactName = primaryContact
    ? [primaryContact.firstName, primaryContact.lastName].filter(Boolean).join(" ")
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground bg-white border rounded-md px-3 py-2">
      <span className="inline-flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" />
        <span className="font-medium text-foreground">{companyName}</span>
      </span>
      {contactName && (
        <span className="inline-flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {contactName}
        </span>
      )}
      {primaryContact?.email && (
        <span className="inline-flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          {primaryContact.email}
        </span>
      )}
    </div>
  );
}
