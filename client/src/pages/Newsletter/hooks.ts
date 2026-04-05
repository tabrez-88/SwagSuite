import { useState } from "react";
import { useTabParam } from "@/hooks/useTabParam";
import type { DashboardStats, Campaign, RecentActivity } from "./types";

export function useNewsletter() {
  const [activeTab, setActiveTab] = useTabParam("dashboard");

  // Mock data for development - will be replaced with real API calls
  const dashboardStats: DashboardStats = {
    totalSubscribers: 15420,
    activeSubscribers: 14830,
    totalCampaigns: 87,
    sentThisMonth: 24,
    avgOpenRate: 24.5,
    avgClickRate: 3.2,
    unsubscribeRate: 0.8,
    revenueGenerated: 85430
  };

  const recentCampaigns: Campaign[] = [
    {
      id: "1",
      name: "Weekly Product Update",
      subject: "New Promotional Products Available",
      status: "sent",
      type: "regular",
      sentAt: "2025-01-02T10:00:00Z",
      totalSent: 14500,
      opens: 3625,
      clicks: 465,
      openRate: 25.0,
      clickRate: 3.2
    },
    {
      id: "2",
      name: "Holiday Sale Campaign",
      subject: "🎉 50% Off All Custom Apparel",
      status: "scheduled",
      type: "regular",
      scheduledAt: "2025-01-10T09:00:00Z",
      totalSent: 0,
      opens: 0,
      clicks: 0,
      openRate: 0,
      clickRate: 0
    },
    {
      id: "3",
      name: "Welcome Series",
      subject: "Welcome to SwagSuite!",
      status: "sending",
      type: "automation",
      totalSent: 1250,
      opens: 387,
      clicks: 58,
      openRate: 30.9,
      clickRate: 4.6
    }
  ];

  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "campaign_sent",
      description: "Weekly Product Update sent to 14,500 subscribers",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "subscriber_added",
      description: "25 new subscribers added via signup form",
      timestamp: "4 hours ago"
    },
    {
      id: "3",
      type: "automation_triggered",
      description: "Welcome series triggered for 12 new subscribers",
      timestamp: "6 hours ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "scheduled": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "sending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "draft": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "paused": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return {
    activeTab,
    setActiveTab,
    dashboardStats,
    recentCampaigns,
    recentActivity,
    getStatusColor,
    formatNumber,
    formatCurrency,
  };
}
