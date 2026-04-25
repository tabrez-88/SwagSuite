import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import type { Invoice } from "@shared/schema";

interface PaymentReminderCardProps {
  invoice: Invoice;
}

export default function PaymentReminderCard({ invoice }: PaymentReminderCardProps) {
  if (!invoice.reminderEnabled) return null;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Payment Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 space-y-1">
        <p>Reminders: Every {invoice.reminderFrequencyDays} days</p>
        {invoice.nextReminderDate && (
          <p>
            Next reminder:{" "}
            {format(new Date(invoice.nextReminderDate), "MMM d, yyyy")}
          </p>
        )}
        {invoice.lastReminderSentAt && (
          <p className="text-xs text-gray-400">
            Last sent:{" "}
            {format(new Date(invoice.lastReminderSentAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
