import { Separator } from "@/components/ui/separator";
import type { EmailFormData } from "./types";

interface EmailPreviewProps {
  form: EmailFormData;
  /** Resolved recipient display (from contacts or manual) */
  recipientDisplay?: string;
}

export default function EmailPreview({ form, recipientDisplay }: EmailPreviewProps) {
  const toDisplay = recipientDisplay || (form.toName ? `${form.toName} <${form.to}>` : form.to);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-sm space-y-1 mb-4">
        <p><strong>To:</strong> {toDisplay}</p>
        {form.from && <p><strong>From:</strong> {form.fromName ? `${form.fromName} <${form.from}>` : form.from}</p>}
        {form.cc && <p><strong>CC:</strong> {form.cc}</p>}
        {form.bcc && <p><strong>BCC:</strong> {form.bcc}</p>}
        <p><strong>Subject:</strong> {form.subject}</p>
      </div>
      <Separator />
      <div
        className="mt-4 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: form.body.replace(/\n/g, "<br />") }}
      />
    </div>
  );
}
