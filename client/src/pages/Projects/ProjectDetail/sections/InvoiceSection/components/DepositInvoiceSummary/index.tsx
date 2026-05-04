import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface DepositInvoiceSummaryProps {
  invoice: {
    invoiceNumber: string;
    totalAmount: string;
    paidAt?: string | Date | null;
  };
}

export default function DepositInvoiceSummary({ invoice }: DepositInvoiceSummaryProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Deposit Invoice {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-green-700">
              ${Number(invoice.totalAmount).toFixed(2)} received
              {invoice.paidAt && ` on ${format(new Date(invoice.paidAt), "MMM d, yyyy")}`}
            </p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-300">
          Received
        </Badge>
      </CardContent>
    </Card>
  );
}
