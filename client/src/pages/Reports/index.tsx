import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  DollarSign,
  Loader2,
  Users,
  Ship,
  Target,
} from "lucide-react";
import { Link } from "@/lib/wouter-compat";
import { useReports, type ArAgingBucket, type MarginCategory } from "./hooks";
import { AIReportGenerator } from "./components/AIReportGenerator";

const AR_BUCKET_ORDER: ArAgingBucket[] = ["current", "1-30", "31-60", "61-90", "90+"];
const AR_BUCKET_LABELS: Record<ArAgingBucket, string> = {
  current: "Current",
  "1-30": "1–30 Days",
  "31-60": "31–60 Days",
  "61-90": "61–90 Days",
  "90+": "90+ Days",
};
const AR_BUCKET_COLORS: Record<ArAgingBucket, string> = {
  current: "bg-green-50 border-green-200 text-green-900",
  "1-30": "bg-yellow-50 border-yellow-200 text-yellow-900",
  "31-60": "bg-orange-50 border-orange-200 text-orange-900",
  "61-90": "bg-red-50 border-red-200 text-red-900",
  "90+": "bg-red-100 border-red-300 text-red-900",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function Reports() {
  const {
    arAging,
    commissionReport,
    commissionLoading,
    commissionFrom,
    setCommissionFrom,
    commissionTo,
    setCommissionTo,
    shippingMargins,
    shippingMarginsLoading,
    shippingMarginPeriod,
    setShippingMarginPeriod,
    leadSourceReport,
    leadSourceLoading,
  } = useReports();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate insights and analyze your business performance</p>
      </div>

      {/* AI Report Generator */}
      <AIReportGenerator />

      {/* Lead Source Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Lead Source Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leadSourceLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading lead source data...
            </div>
          ) : !leadSourceReport || leadSourceReport.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No lead source data available.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Contacts</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadSourceReport.map((row) => (
                    <TableRow key={row.source}>
                      <TableCell className="font-medium">{row.source}</TableCell>
                      <TableCell className="text-right">{row.contacts ?? 0}</TableCell>
                      <TableCell className="text-right">{row.leads ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.total ?? (row.contacts ?? 0) + (row.leads ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounts Receivable Aging */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Accounts Receivable Aging
            </CardTitle>
            {arAging && (
              <Badge variant="outline" className="text-sm">
                {formatCurrency(arAging.totalOutstanding)} outstanding · {arAging.totalInvoices} open
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!arAging || arAging.totalInvoices === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>No open invoices. All paid up.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bucket tiles */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {AR_BUCKET_ORDER.map((bucket) => {
                  const data = arAging.buckets[bucket];
                  return (
                    <div
                      key={bucket}
                      className={`rounded-lg border p-3 ${AR_BUCKET_COLORS[bucket]}`}
                      data-testid={`ar-bucket-${bucket}`}
                    >
                      <div className="text-xs font-medium opacity-80">{AR_BUCKET_LABELS[bucket]}</div>
                      <div className="text-xl font-bold mt-1">{formatCurrency(data.total)}</div>
                      <div className="text-xs mt-0.5 opacity-70">{data.count} {data.count === 1 ? "invoice" : "invoices"}</div>
                    </div>
                  );
                })}
              </div>

              {/* Invoice table (top 10 most overdue) */}
              {arAging.invoices.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Invoice</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Customer</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Project</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Due Date</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-700">Days Past Due</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arAging.invoices.slice(0, 10).map((inv) => (
                        <tr key={inv.invoiceId} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">
                            {inv.orderId ? (
                              <Link href={`/projects/${inv.orderId}/invoice`} className="text-blue-600 hover:underline">
                                {inv.invoiceNumber}
                              </Link>
                            ) : (
                              inv.invoiceNumber
                            )}
                          </td>
                          <td className="px-3 py-2">{inv.companyName || "—"}</td>
                          <td className="px-3 py-2 text-gray-600">{inv.projectName || inv.orderNumber || "—"}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {inv.daysPastDue > 0 ? (
                              <span className={inv.daysPastDue > 60 ? "text-red-600 font-semibold" : "text-orange-600"}>
                                {inv.daysPastDue}
                              </span>
                            ) : (
                              <span className="text-green-600">Current</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(inv.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {arAging.invoices.length > 10 && (
                    <div className="px-3 py-2 bg-gray-50 border-t text-xs text-muted-foreground text-center">
                      Showing 10 of {arAging.invoices.length} open invoices
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Commission Report
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={commissionFrom}
                onChange={(e) => setCommissionFrom(e.target.value)}
                className="w-36 h-8 text-xs"
              />
              <span className="text-xs text-gray-500">to</span>
              <Input
                type="date"
                value={commissionTo}
                onChange={(e) => setCommissionTo(e.target.value)}
                className="w-36 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {commissionLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading commission data...
            </div>
          ) : !commissionReport || commissionReport.reps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No commission data for this period.</p>
              <p className="text-xs mt-1">
                Set commission percentages in Settings → Users tab.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                  <div className="text-xs text-blue-700">Total Revenue</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {formatCurrency(commissionReport.grandTotalRevenue)}
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                  <div className="text-xs text-green-700">Gross Profit</div>
                  <div className="text-lg font-semibold text-green-900">
                    {formatCurrency(commissionReport.grandTotalGrossProfit)}
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                  <div className="text-xs text-purple-700">Total Commissions</div>
                  <div className="text-lg font-semibold text-purple-900">
                    {formatCurrency(commissionReport.grandTotalCommission)}
                  </div>
                </div>
              </div>

              {/* Per-rep table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sales Rep</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionReport.reps.map((rep) => (
                      <TableRow key={rep.userId}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{rep.name}</span>
                            {rep.email && (
                              <span className="text-xs text-gray-500 ml-2">{rep.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{rep.commissionPercent}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">{rep.orderCount}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(rep.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(rep.totalGrossProfit)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-purple-700">
                          {formatCurrency(rep.totalCommission)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping & Setup Margins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Shipping & Setup Margins
            </CardTitle>
            <Select value={shippingMarginPeriod} onValueChange={setShippingMarginPeriod}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="wtd">Week to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {shippingMarginsLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading margin data...
            </div>
          ) : !shippingMargins ? (
            <div className="text-center py-8 text-gray-500">
              <Ship className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No margin data available for this period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="border rounded-lg p-3 bg-slate-50 border-slate-200">
                  <div className="text-xs text-slate-600">Orders</div>
                  <div className="text-lg font-semibold text-slate-900">{shippingMargins.orderCount}</div>
                </div>
                <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                  <div className="text-xs text-blue-700">Total Revenue</div>
                  <div className="text-lg font-semibold text-blue-900">{formatCurrency(shippingMargins.overall.revenue)}</div>
                </div>
                <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                  <div className="text-xs text-green-700">Total Margin</div>
                  <div className="text-lg font-semibold text-green-900">{formatCurrency(shippingMargins.overall.margin)}</div>
                </div>
                <div className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                  <div className="text-xs text-purple-700">Margin %</div>
                  <div className="text-lg font-semibold text-purple-900">{shippingMargins.overall.marginPercent}%</div>
                </div>
              </div>

              {/* Category breakdown table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      [
                        { label: "Product", data: shippingMargins.product, color: "text-blue-700" },
                        { label: "Shipping", data: shippingMargins.shipping, color: "text-orange-700" },
                        { label: "Setup / Fixed", data: shippingMargins.setup, color: "text-violet-700" },
                      ] as { label: string; data: MarginCategory; color: string }[]
                    ).map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.data.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.data.cost)}</TableCell>
                        <TableCell className={`text-right font-semibold ${row.data.margin >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {formatCurrency(row.data.margin)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${row.color}`}>
                          {row.data.marginPercent}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell>Overall</TableCell>
                      <TableCell className="text-right">{formatCurrency(shippingMargins.overall.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(shippingMargins.overall.cost)}</TableCell>
                      <TableCell className={`text-right ${shippingMargins.overall.margin >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {formatCurrency(shippingMargins.overall.margin)}
                      </TableCell>
                      <TableCell className="text-right text-purple-700">{shippingMargins.overall.marginPercent}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
