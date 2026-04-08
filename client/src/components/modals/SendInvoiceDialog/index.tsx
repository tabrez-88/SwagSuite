import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Bell } from "lucide-react";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
import { useSendInvoice } from "./hooks";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDocument: any;
  totalAmount: number;
  dueDate?: string;
  contacts?: EmailContact[];
}

export default function SendInvoiceDialog({
  open, onOpenChange, projectId, recipientEmail, recipientName, companyName, orderNumber,
  invoiceNumber, invoiceDocument, totalAmount, dueDate, contacts,
}: SendInvoiceDialogProps) {
  const {
    reminderEnabled,
    setReminderEnabled,
    reminderFrequency,
    setReminderFrequency,
    sendMutation,
  } = useSendInvoice({ projectId, recipientName, invoiceNumber, invoiceDocument, onOpenChange });

  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const mergeData = useMemo(() => ({
    companyName,
    senderName: "",
    recipientName,
    recipientFirstName: recipientName.split(" ")[0] || "there",
    orderNumber,
    invoiceNumber,
    totalAmount: `$${totalAmount.toFixed(2)}`,
    dueDate: dueDateFormatted || "",
  }), [companyName, recipientName, orderNumber, invoiceNumber, totalAmount, dueDateFormatted]);

  const reminderSection = (
    <div className="border rounded-lg p-3 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <label htmlFor="reminder-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
            Send payment reminders if unpaid
          </label>
        </div>
        <Switch
          id="reminder-toggle"
          checked={reminderEnabled}
          onCheckedChange={setReminderEnabled}
        />
      </div>
      {reminderEnabled && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Remind every</span>
          <Select
            value={String(reminderFrequency)}
            onValueChange={(val) => setReminderFrequency(Number(val))}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-500">until paid</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Invoice
          </DialogTitle>
          <DialogDescription>
            Send Invoice #{invoiceNumber} to your client via email.
          </DialogDescription>
        </DialogHeader>

        <EmailComposer
          contacts={contacts}
          defaults={{
            to: recipientEmail,
            toName: recipientName,
            subject: `Invoice #${invoiceNumber} from ${companyName}`,
            body: `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find attached Invoice #${invoiceNumber} for $${totalAmount.toFixed(2)}${dueDateFormatted ? ` due by ${dueDateFormatted}` : ""}.\n\nIf you have any questions regarding this invoice, please don't hesitate to reach out.\n\nThank you for your business!\n\nBest regards,\n${companyName}`,
          }}
          templateType="invoice"
          templateMergeData={mergeData}
          showAdvancedFields
          richText
          showAttachments
          contextProjectId={projectId}
          footerHint="The invoice PDF will be attached to the email."
          afterBody={reminderSection}
          onSend={(data) => sendMutation.mutate(data)}
          isSending={sendMutation.isPending}
          sendLabel="Send Invoice"
          onCancel={() => onOpenChange(false)}
          resetTrigger={open}
        />
      </DialogContent>
    </Dialog>
  );
}
