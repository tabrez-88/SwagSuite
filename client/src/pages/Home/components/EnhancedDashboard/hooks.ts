import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useEnhancedStats,
  useTeamLeaderboard,
  useRecentActivities,
  useAutomationTasks,
  useNewsAlerts,
  useSeedDummyData,
} from "@/services/dashboard";
import { useArAging } from "@/services/reports";
import type { DashboardMetrics, TeamLeaderboard, RecentActivity, AIAutomationTask, NewsAlert } from "./types";
import type { ArAgingReport } from "@/pages/Reports/hooks";

export function useEnhancedDashboard() {
  const [dateRange, setDateRange] = useState<string>("ytd");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();

  const { data: metrics } = useEnhancedStats(dateRange);
  const { data: leaderboard } = useTeamLeaderboard(dateRange);
  const { data: recentActivities } = useRecentActivities();
  const { data: automationTasks } = useAutomationTasks();
  const { data: newsAlerts } = useNewsAlerts();
  const { data: arAging } = useArAging<ArAgingReport>();

  const pick = (prefix: string, range: string): number => {
    if (!metrics) return 0;
    const key =
      range === "ytd" ? `ytd${prefix}` :
      range === "mtd" ? `mtd${prefix}` :
      range === "wtd" ? `wtd${prefix}` :
      `today${prefix}`;
    return (metrics as any)[key] || 0;
  };

  const pickComparison = (prefix: string, range: string): number => {
    if (!metrics) return 0;
    const key =
      range === "ytd" ? `lastYearYtd${prefix}` :
      range === "mtd" ? `lastMonth${prefix}` :
      range === "wtd" ? `lastWeek${prefix}` :
      `yesterday${prefix}`;
    return (metrics as any)[key] || 0;
  };

  const comparisonLabel = (range: string): string => {
    switch (range) {
      case "ytd": return "vs LYTD";
      case "mtd": return "vs last month";
      case "wtd": return "vs last week";
      case "today": return "vs yesterday";
      default: return "";
    }
  };

  const getMetricByRange = (range: string) => pick("Revenue", range);
  const getComparisonMetric = (range: string) => pickComparison("Revenue", range);

  const getMarginByRange = (range: string) => pick("Margin", range);
  const getComparisonMargin = (range: string) => pickComparison("Margin", range);

  const getAvgOrderValueByRange = (range: string) => pick("AvgOrderValue", range);
  const getComparisonAvgOrderValue = (range: string) => pickComparison("AvgOrderValue", range);

  const getOrderQuantityByRange = (range: string) => pick("OrderQuantity", range);
  const getComparisonOrderQuantity = (range: string) => pickComparison("OrderQuantity", range);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-100 text-green-800";
      case "negative": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const _seedData = useSeedDummyData();
  const seedDataMutation = {
    ..._seedData,
    mutate: () =>
      _seedData.mutate(undefined, {
        onSuccess: () =>
          toast({
            title: "Success!",
            description:
              "Dummy data has been added to the system. You can now see sample orders, clients, vendors, and artwork cards.",
          }),
        onError: (error: Error) =>
          toast({
            title: "Error",
            description: `Failed to seed dummy data: ${error.message}`,
            variant: "destructive",
          }),
      }),
  };

  return {
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    metrics,
    leaderboard,
    recentActivities,
    automationTasks,
    newsAlerts,
    arAging,
    getMetricByRange,
    getComparisonMetric,
    getMarginByRange,
    getComparisonMargin,
    getAvgOrderValueByRange,
    getComparisonAvgOrderValue,
    getOrderQuantityByRange,
    getComparisonOrderQuantity,
    comparisonLabel,
    calculateGrowth,
    getPriorityColor,
    getSentimentColor,
    seedDataMutation,
  };
}
