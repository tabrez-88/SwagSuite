import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { createElement } from "react";
import type { AnalyticsData, CampaignPerformance, SubjectLineTest, DeviceData, EngagementData } from "./types";

export function useAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("opens");

  // Mock analytics data
  const performanceData: AnalyticsData[] = [
    { period: "Week 1", sent: 15420, delivered: 15200, opened: 3800, clicked: 456, unsubscribed: 12, bounced: 220, revenue: 12500 },
    { period: "Week 2", sent: 14800, delivered: 14580, opened: 3650, clicked: 438, unsubscribed: 18, bounced: 220, revenue: 11800 },
    { period: "Week 3", sent: 16200, delivered: 15950, opened: 4150, clicked: 515, unsubscribed: 15, bounced: 250, revenue: 14200 },
    { period: "Week 4", sent: 15800, delivered: 15580, opened: 3950, clicked: 482, unsubscribed: 21, bounced: 220, revenue: 13100 }
  ];

  const topCampaigns: CampaignPerformance[] = [
    {
      id: "1",
      name: "Holiday Sale Campaign",
      sentDate: "2025-01-02",
      recipients: 15420,
      opens: 4200,
      clicks: 840,
      openRate: 27.2,
      clickRate: 5.4,
      revenue: 18500
    },
    {
      id: "2",
      name: "Product Launch: Custom Mugs",
      sentDate: "2024-12-28",
      recipients: 12300,
      opens: 3200,
      clicks: 480,
      openRate: 26.0,
      clickRate: 3.9,
      revenue: 12200
    },
    {
      id: "3",
      name: "Welcome Series Email #1",
      sentDate: "2024-12-20",
      recipients: 1250,
      opens: 387,
      clicks: 58,
      openRate: 30.9,
      clickRate: 4.6,
      revenue: 2800
    }
  ];

  const abTests: SubjectLineTest[] = [
    {
      id: "1",
      subjectA: "New Products Available",
      subjectB: "\u{1F525} Hot New Products Just Arrived!",
      winningSide: "B",
      openRateA: 22.4,
      openRateB: 28.7,
      improvement: 28.1
    },
    {
      id: "2",
      subjectA: "Your Order Update",
      subjectB: "Great News About Your Order!",
      winningSide: "B",
      openRateA: 31.2,
      openRateB: 35.8,
      improvement: 14.7
    }
  ];

  const deviceData: DeviceData[] = [
    { name: "Mobile", value: 58, color: "#3b82f6" },
    { name: "Desktop", value: 32, color: "#10b981" },
    { name: "Tablet", value: 10, color: "#f59e0b" }
  ];

  const engagementData: EngagementData[] = [
    { period: "Jan 1", subscribers: 14850, active: 12200, engaged: 8900 },
    { period: "Jan 8", subscribers: 15100, active: 12450, engaged: 9100 },
    { period: "Jan 15", subscribers: 15380, active: 12680, engaged: 9250 },
    { period: "Jan 22", subscribers: 15420, active: 12750, engaged: 9320 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return createElement(TrendingUp, { className: "w-4 h-4 text-green-600" });
    } else if (current < previous) {
      return createElement(TrendingDown, { className: "w-4 h-4 text-red-600" });
    }
    return null;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-600";
  };

  const calculateTrend = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return {
    timeRange,
    setTimeRange,
    selectedMetric,
    setSelectedMetric,
    performanceData,
    topCampaigns,
    abTests,
    deviceData,
    engagementData,
    formatCurrency,
    formatPercentage,
    getTrendIcon,
    getTrendColor,
    calculateTrend,
  };
}
