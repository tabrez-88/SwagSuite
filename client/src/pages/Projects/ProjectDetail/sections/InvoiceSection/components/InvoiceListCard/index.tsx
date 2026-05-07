import { useState } from "react";
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

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function matchesFilter(status: string | undefined, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "paid") return status === "paid";
  if (filter === "overdue") return status === "overdue";
  // "unpaid" = everything except paid, cancelled, void
  return status !== "paid" && status !== "cancelled" && status !== "void";
}

function formatAmount(amount: string | number | undefined): string {
  if (!amount) return "$0.00";
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceListCard({ invoices, selectedInvoiceId, onSelect }: InvoiceListCardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  if (!invoices || invoices.length === 0) return null;

  const filtered = invoices.filter((inv) => matchesFilter(inv.status, statusFilter));

  // Compute counts for each filter tab
  const counts: Record<StatusFilter, number> = {
    all: invoices.length,
    unpaid: invoices.filter((i) => matchesFilter(i.status, "unpaid")).length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoices ({filtered.length}{statusFilter !== "all" ? ` of ${invoices.length}` : ""})
          </CardTitle>
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === f.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
                {counts[f.value] > 0 && (
                  <span className={`ml-1 ${statusFilter === f.value ? "text-gray-300" : "text-gray-400"}`}>
                    {counts[f.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">
                  No {statusFilter} invoices
                </td>
              </tr>
            ) : filtered.map((inv) => {
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
