import { Building2, User, Mail } from "lucide-react";
import { Separator } from "../ui/separator";

interface ProjectInfoBarProps {
  companyName: string;
  primaryContact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  assignedUser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

export default function ProjectInfoBar({
  companyName,
  primaryContact,
  assignedUser,
}: ProjectInfoBarProps) {
  const contactName = primaryContact
    ? [primaryContact.firstName, primaryContact.lastName]
        .filter(Boolean)
        .join(" ")
    : null;

  const assignedUserName = assignedUser
    ? [assignedUser.firstName, assignedUser.lastName].filter(Boolean).join(" ")
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
      {/* {assignedUserName && (
        <div className="flex gap-2 items-center bg-primary text-white rounded-lg px-2 py-1">
          <span>Sales Rep :</span>
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {assignedUserName}
          </span>
          {assignedUser?.email && (
            <span className="inline-flex text-xs items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {assignedUser.email}
            </span>
          )}
        </div>
      )} */}
    </div>
  );
}
