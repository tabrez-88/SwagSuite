import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";

export function useReports() {
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
    alert(`Generating ${reportTitle} for ${getDateRangeLabel(dateRange)}`);
  };

  const handleCreateCustomReport = () => {
    alert("Custom report creation would be implemented with AI integration");
    setIsCustomReportOpen(false);
  };

  return {
    dateRange,
    setDateRange,
    reportType,
    setReportType,
    isCustomReportOpen,
    setIsCustomReportOpen,
    customReport,
    setCustomReport,
    statsLoading,
    quickReports,
    savedReports,
    getDateRangeLabel,
    handleGenerateReport,
    handleCreateCustomReport,
  };
}
