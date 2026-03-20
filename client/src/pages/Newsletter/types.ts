export interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  sentThisMonth: number;
  avgOpenRate: number;
  avgClickRate: number;
  unsubscribeRate: number;
  revenueGenerated: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  type: "regular" | "automation" | "ab_test";
  scheduledAt?: string;
  sentAt?: string;
  totalSent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
}

export interface RecentActivity {
  id: string;
  type: "campaign_sent" | "subscriber_added" | "automation_triggered";
  description: string;
  timestamp: string;
}
