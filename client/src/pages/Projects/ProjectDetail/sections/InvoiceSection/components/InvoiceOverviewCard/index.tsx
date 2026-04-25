import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock, FileText, Info } from "lucide-react";
import { format } from "date-fns";
import { invoiceStatusColors } from "../../types";
import type { Invoice } from "@shared/schema";

interface AgingInfo {
  daysOverdue: number;
  category: string;
  colorClass: string;
}

interface InvoiceOverviewCardProps {
  invoice: Invoice;
  agingInfo: AgingInfo | null;
  onDueDateChange: (value: string) => void;
}

export default function InvoiceOverviewCard({
  invoice,
  agingInfo,
  onDueDateChange,
}: InvoiceOverviewCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {invoice.invoiceType === "deposit" ? "Deposit " : invoice.invoiceType === "final" ? "Final " : ""}
            Invoice #{invoice.invoiceNumber}
            {invoice.invoiceType === "deposit" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">DEPOSIT</Badge>
            )}
            {invoice.invoiceType === "final" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">FINAL</Badge>
            )}
          </CardTitle>
          <Badge className={invoiceStatusColors[invoice.status ?? ""] || ""}>
            {invoice.status?.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="font-medium">
              ${Number(invoice.subtotal || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tax</p>
            <p className="font-medium">
              ${Number(invoice.taxAmount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-bold text-lg">
              ${Number(invoice.totalAmount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Due Date
            </p>
            {invoice.status === "paid" ? (
              <p className="font-medium">
                {invoice.dueDate
                  ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                  : "Not set"}
              </p>
            ) : (
              <Input
                type="date"
                className="h-8 text-sm w-[150px]"
                value={
                  invoice.dueDate
                    ? format(new Date(invoice.dueDate), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => onDueDateChange(e.target.value)}
              />
            )}
          </div>
        </div>

        {agingInfo && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${agingInfo.colorClass}`}>
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {agingInfo.daysOverdue} days overdue
            </span>
            <span className="text-xs opacity-75">
              ({agingInfo.category})
            </span>
          </div>
        )}

        {/* CC Processing Fee Info */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs">
            A 3% credit card processing fee applies to payments made by
            credit/debit card.
          </p>
        </div>

        {/* Sent timestamp */}
        {invoice.sentAt && (
          <p className="text-xs text-gray-400">
            Sent on{" "}
            {format(new Date(invoice.sentAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}

        {invoice.createdAt && (
          <p className="text-xs text-gray-400">
            Created{" "}
            {format(new Date(invoice.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
