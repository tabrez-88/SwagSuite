import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Plus, X } from "lucide-react";
import type { EmailContact } from "./types";

interface EmailContactPickerProps {
  contacts: EmailContact[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  /** Additional ad-hoc emails added by user */
  adHocEmails?: string[];
  onAdHocChange?: (emails: string[]) => void;
}

export default function EmailContactPicker({
  contacts,
  selectedIds,
  onToggle,
  adHocEmails = [],
  onAdHocChange,
}: EmailContactPickerProps) {
  const [newEmail, setNewEmail] = useState("");
  const contactsWithEmail = contacts.filter((c) => c.email);
  const contactsWithoutEmail = contacts.filter((c) => !c.email);

  const addAdHocEmail = () => {
    const trimmed = newEmail.trim();
    if (trimmed && !adHocEmails.includes(trimmed)) {
      onAdHocChange?.([...adHocEmails, trimmed]);
      setNewEmail("");
    }
  };

  const removeAdHocEmail = (email: string) => {
    onAdHocChange?.(adHocEmails.filter((e) => e !== email));
  };

  return (
    <div>
      <Label>To *</Label>
      <div className="mt-1 border rounded-lg divide-y max-h-48 overflow-y-auto">
        {contactsWithEmail.length === 0 && adHocEmails.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">No contacts with email address</p>
        ) : (
          <>
            {contactsWithEmail.map((contact) => (
              <label
                key={contact.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(contact.id)}
                  onCheckedChange={() => onToggle(contact.id)}
                />
                <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">
                    {contact.firstName} {contact.lastName}
                  </span>
                  {contact.title && (
                    <span className="text-xs text-muted-foreground ml-1.5">· {contact.title}</span>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {contact.isPrimary && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                  )}
                  {contact.receiveOrderEmails && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">Order Emails</Badge>
                  )}
                </div>
              </label>
            ))}
            {adHocEmails.map((email) => (
              <div key={email} className="flex items-center gap-3 px-3 py-2 bg-blue-50/50">
                <Checkbox checked disabled />
                <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-700">{email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                  onClick={() => removeAdHocEmail(email)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Ad-hoc email input */}
      <div className="flex gap-2 mt-2">
        <Input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Add email address..."
          className="text-sm h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAdHocEmail();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={addAdHocEmail}
          disabled={!newEmail.trim()}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {contactsWithoutEmail.length > 0 && (
        <p className="text-xs text-amber-600 mt-1">
          {contactsWithoutEmail.length} contact(s) hidden — no email address
        </p>
      )}
    </div>
  );
}
