import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardMetrics, TeamLeaderboard, AIAutomationTask, NewsAlert } from "./types";
import type { ArAgingReport } from "@/pages/Reports/hooks";

export function useEnhancedDashboard() {
  const [dateRange, setDateRange] = useState<string>("ytd");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/enhanced-stats', { range: dateRange }],
    refetchInterval: 60000,
  });

  const { data: leaderboard } = useQuery<TeamLeaderboard[]>({
    queryKey: ['/api/dashboard/team-leaderboard', { range: dateRange }],
    refetchInterval: 300000,
  });

  const { data: automationTasks } = useQuery<AIAutomationTask[]>({
    queryKey: ['/api/dashboard/automation-tasks'],
    refetchInterval: 30000,
  });

  const { data: newsAlerts } = useQuery<NewsAlert[]>({
    queryKey: ['/api/dashboard/news-alerts'],
    refetchInterval: 300000,
  });

  const { data: arAging } = useQuery<ArAgingReport>({
    queryKey: ['/api/reports/accounts-receivable'],
    refetchInterval: 300000,
  });

  const getMetricByRange = (range: string) => {
    switch (range) {
      case 'ytd': return metrics?.ytdRevenue || 0;
      case 'mtd': return metrics?.mtdRevenue || 0;
      case 'wtd': return metrics?.wtdRevenue || 0;
      case 'today': return metrics?.todayRevenue || 0;
      default: return metrics?.ytdRevenue || 0;
    }
  };

  const getComparisonMetric = (range: string) => {
    switch (range) {
      case 'ytd': return metrics?.lastYearYtdRevenue || 0;
      case 'mtd': return metrics?.lastMonthRevenue || 0;
      default: return 0;
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const seedDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/seed-dummy-data', {});
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Dummy data has been added to the system. You can now see sample orders, clients, vendors, and artwork cards.",
      });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to seed dummy data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    metrics,
    leaderboard,
    automationTasks,
    newsAlerts,
    arAging,
    getMetricByRange,
    getComparisonMetric,
    calculateGrowth,
    getPriorityColor,
    getSentimentColor,
    seedDataMutation,
  };
}
