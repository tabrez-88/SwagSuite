import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";

interface InvoiceListItem {
  id: number;
  invoiceNumber?: string;
  invoiceType?: string;
  totalAmount?: string | number;
  status?: string;
  createdAt?: string;
}

interface InvoiceListCardProps {
  invoices: InvoiceListItem[];
  selectedInvoiceId: number | null;
  onSelect: (id: number) => void;
}

const typeColors: Record<string, string> = {
  deposit: "bg-blue-100 text-blue-700",
  final: "bg-purple-100 text-purple-700",
  standard: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-red-50 text-red-500",
  void: "bg-red-50 text-red-500",
};

function formatAmount(amount: string | number | undefined): string {
  if (!amount) return "$0.00";
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceListCard({ invoices, selectedInvoiceId, onSelect }: InvoiceListCardProps) {
  if (!invoices || invoices.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          All Invoices ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Invoice #</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const isSelected = inv.id === selectedInvoiceId;
              const type = inv.invoiceType || "standard";
              return (
                <tr
                  key={inv.id}
                  onClick={() => onSelect(inv.id)}
                  className={`cursor-pointer border-b last:border-b-0 transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className={`text-xs capitalize ${typeColors[type] || typeColors.standard}`}>
                      {type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {inv.invoiceNumber || "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    {formatAmount(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className={`text-xs capitalize ${statusColors[inv.status || "draft"] || statusColors.draft}`}>
                      {inv.status || "draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {inv.createdAt ? format(new Date(inv.createdAt), "MMM d, yyyy") : "\u2014"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
