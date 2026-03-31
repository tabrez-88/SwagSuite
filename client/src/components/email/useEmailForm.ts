import { useState, useCallback, useEffect } from "react";
import type { EmailFormData, EmailFormField, EmailContact, EmailAttachment } from "./types";

const EMPTY_FORM: EmailFormData = {
  to: "",
  toName: "",
  from: "",
  fromName: "",
  cc: "",
  bcc: "",
  subject: "",
  body: "",
  selectedContactIds: new Set(),
  attachments: [],
};

interface UseEmailFormOptions {
  defaults?: Partial<EmailFormData>;
  contacts?: EmailContact[];
  resetTrigger?: any;
}

export function useEmailForm({ defaults, contacts, resetTrigger }: UseEmailFormOptions = {}) {
  const buildInitial = useCallback((): EmailFormData => {
    const initial = { ...EMPTY_FORM, ...defaults };
    // Auto-select primary or receiveOrderEmails contacts
    if (contacts && contacts.length > 0 && (!defaults?.selectedContactIds || defaults.selectedContactIds.size === 0)) {
      const autoSelected = new Set<string>();
      const contactsWithEmail = contacts.filter((c) => c.email);
      for (const c of contactsWithEmail) {
        if (c.receiveOrderEmails || c.isPrimary) {
          autoSelected.add(c.id);
        }
      }
      // Fallback: select primary if nothing auto-selected
      if (autoSelected.size === 0) {
        const primary = contactsWithEmail.find((c) => c.isPrimary);
        if (primary) autoSelected.add(primary.id);
      }
      initial.selectedContactIds = autoSelected;
    }
    return initial;
  }, [defaults, contacts]);

  const [form, setForm] = useState<EmailFormData>(buildInitial);

  // Reset when trigger changes (e.g., dialog open)
  useEffect(() => {
    if (resetTrigger) {
      setForm(buildInitial());
    }
  }, [resetTrigger, buildInitial]);

  const setField = useCallback((field: EmailFormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleContact = useCallback((id: string) => {
    setForm((prev) => {
      const next = new Set(prev.selectedContactIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selectedContactIds: next };
    });
  }, []);

  const reset = useCallback((newDefaults?: Partial<EmailFormData>) => {
    if (newDefaults) {
      setForm({ ...EMPTY_FORM, ...newDefaults });
    } else {
      setForm(buildInitial());
    }
  }, [buildInitial]);

  const addAttachments = useCallback((files: EmailAttachment[]) => {
    setForm((prev) => {
      const existingIds = new Set(prev.attachments.map((a) => a.id));
      const newFiles = files.filter((f) => !existingIds.has(f.id));
      return { ...prev, attachments: [...prev.attachments, ...newFiles] };
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  }, []);

  return { form, setField, setForm, toggleContact, reset, addAttachments, removeAttachment };
}
