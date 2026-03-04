import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Building2 } from "lucide-react";
import { format } from "date-fns";
import type { useProjectData } from "../hooks/useProjectData";

interface BillsSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

const billStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  vouched: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function BillsSection({ orderId, data }: BillsSectionProps) {
  const { vendorInvoices, orderVendors } = data;

  // Group vendor invoices by supplier
  const invoicesByVendor = vendorInvoices.reduce((acc: Record<string, any[]>, inv: any) => {
    const key = inv.supplierId || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(inv);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Bills
        </h2>
        <p className="text-sm text-gray-500">
          Vendor invoices and bills for this project
        </p>
      </div>

      {vendorInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendor bills yet</h3>
            <p className="text-gray-500">
              Vendor bills will appear here as purchase orders are fulfilled
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Total Bills</p>
                <p className="text-2xl font-bold">{vendorInvoices.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${vendorInvoices.reduce((s: number, v: any) => s + Number(v.amount || 0), 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {vendorInvoices.filter((v: any) => v.status === "paid").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bills List */}
          {Object.entries(invoicesByVendor).map(([supplierId, invoices]) => {
            const vendor = orderVendors.find((v: any) => v.id === supplierId);
            return (
              <Card key={supplierId}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {vendor?.name || "Unknown Vendor"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(invoices as any[]).map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            Invoice #{inv.invoiceNumber || "N/A"}
                          </p>
                          {inv.receivedDate && (
                            <p className="text-xs text-gray-500">
                              Received {format(new Date(inv.receivedDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">
                            ${Number(inv.amount || 0).toLocaleString()}
                          </span>
                          <Badge className={billStatusColors[inv.status] || ""}>
                            {inv.status?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
