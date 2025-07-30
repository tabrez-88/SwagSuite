import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Plus,
  DollarSign,
  Package,
  Users,
  ShoppingCart
} from "lucide-react";

export default function Reports() {
  const [dateRange, setDateRange] = useState("ytd");
  const [reportType, setReportType] = useState("revenue");
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false);
  const [customReport, setCustomReport] = useState({
    name: "",
    description: "",
    query: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case "ytd": return "Year to Date";
      case "mtd": return "Month to Date";
      case "wtd": return "Week to Date";
      case "last30": return "Last 30 Days";
      case "last90": return "Last 90 Days";
      default: return "Year to Date";
    }
  };

  const quickReports = [
    {
      title: "Revenue Analysis",
      description: "Detailed revenue breakdown by period",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      value: stats?.totalRevenue ? `$${(stats.totalRevenue / 1000000).toFixed(1)}M` : "$0",
    },
    {
      title: "Order Performance", 
      description: "Order volume and conversion metrics",
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-600",
      value: orders?.length || 0,
    },
    {
      title: "Customer Analytics",
      description: "Customer growth and retention stats",
      icon: Users,
      color: "bg-purple-100 text-purple-600", 
      value: companies?.length || 0,
    },
    {
      title: "Product Performance",
      description: "Top selling products and categories",
      icon: Package,
      color: "bg-orange-100 text-orange-600",
      value: products?.length || 0,
    },
  ];

  const savedReports = [
    {
      id: "1",
      name: "Monthly Sales Summary",
      description: "Comprehensive monthly sales report",
      lastRun: "2024-01-15",
      schedule: "Monthly",
    },
    {
      id: "2", 
      name: "Top Customers by Revenue",
      description: "Customer ranking by total spend",
      lastRun: "2024-01-14",
      schedule: "Weekly",
    },
    {
      id: "3",
      name: "Supplier Performance Report",
      description: "Analysis of supplier delivery and quality",
      lastRun: "2024-01-13", 
      schedule: "Quarterly",
    },
  ];

  const handleGenerateReport = (reportTitle: string) => {
    // This would trigger actual report generation
    alert(`Generating ${reportTitle} for ${getDateRangeLabel(dateRange)}`);
  };

  const handleCreateCustomReport = () => {
    // This would create a custom report using AI/natural language processing
    alert("Custom report creation would be implemented with AI integration");
    setIsCustomReportOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
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
            <DialogContent className="max-w-2xl">
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
      </div>
    </Layout>
  );
}
