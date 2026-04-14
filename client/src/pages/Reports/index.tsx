import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Plus,
  AlertCircle,
  DollarSign,
  Loader2,
  Users,
} from "lucide-react";
import { Link } from "@/lib/wouter-compat";
import { useReports, type ArAgingBucket } from "./hooks";

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
    dateRange,
    setDateRange,
    reportType,
    setReportType,
    isCustomReportOpen,
    setIsCustomReportOpen,
    customReport,
    setCustomReport,
    quickReports,
    savedReports,
    arAging,
    commissionReport,
    commissionLoading,
    commissionFrom,
    setCommissionFrom,
    commissionTo,
    setCommissionTo,
    getDateRangeLabel,
    handleGenerateReport,
    handleCreateCustomReport,
  } = useReports();

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate insights and analyze your business performance</p>
          </div>

          <Dialog open={isCustomReportOpen} onOpenChange={setIsCustomReportOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={20} />
                Create Custom Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Create Custom Report with AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={customReport.name}
                    onChange={(e) => setCustomReport(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Quarterly Margin Analysis"
                  />
                </div>
                <div>
                  <Label htmlFor="reportDesc">Description</Label>
                  <Input
                    id="reportDesc"
                    value={customReport.description}
                    onChange={(e) => setCustomReport(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this report"
                  />
                </div>
                <div>
                  <Label htmlFor="aiQuery">Natural Language Query</Label>
                  <Textarea
                    id="aiQuery"
                    value={customReport.query}
                    onChange={(e) => setCustomReport(prev => ({ ...prev, query: e.target.value }))}
                    placeholder="Describe what you want to analyze. For example: 'Show me our top 10 customers by revenue this year with their order frequency and average order value'"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use natural language to describe the report you want. AI will generate the appropriate queries.
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCustomReportOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCustomReport}
                    className="bg-swag-primary hover:bg-swag-primary/90"
                  >
                    Generate Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="dateRange">Date Range:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="mtd">Month to Date</SelectItem>
                  <SelectItem value="wtd">Week to Date</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="last90">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="ml-2">
                {getDateRangeLabel(dateRange)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickReports.map((report) => (
              <Card key={report.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${report.color}`}>
                      <report.icon size={24} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateReport(report.title)}
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{report.value}</span>
                      <TrendingUp className="text-green-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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

        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Trends</CardTitle>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="margin">Margin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 size={64} className="mx-auto mb-4" />
                <p className="text-lg font-medium">Interactive Charts Coming Soon</p>
                <p className="text-sm mt-1">Real-time analytics dashboard with Chart.js integration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Reports */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Saved Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                    <Badge variant="secondary">{report.schedule}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      Last run: {new Date(report.lastRun).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGenerateReport(report.name)}
                      >
                        <Download size={16} className="mr-1" />
                        Run Now
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Report Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-6 h-6 bg-swag-secondary rounded mr-2 flex items-center justify-center">
                <span className="text-xs font-bold text-swag-dark">AI</span>
              </div>
              Suggested Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Customer Retention Analysis</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Based on your order patterns, analyze which customers are most likely to reorder
                </p>
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                  Generate Report
                </Button>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Seasonal Product Demand</h4>
                <p className="text-sm text-green-700 mb-2">
                  Identify seasonal trends in your product catalog to optimize inventory
                </p>
                <Button size="sm" variant="outline" className="text-green-700 border-green-300">
                  Generate Report
                </Button>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-1">Supplier Performance Score</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Compare supplier delivery times, quality, and pricing to optimize your vendor mix
                </p>
                <Button size="sm" variant="outline" className="text-purple-700 border-purple-300">
                  Generate Report
                </Button>
              </div>
            </div>
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
    </div>
  );
}
