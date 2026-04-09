export interface DashboardMetrics {
  totalRevenue: number;
  activeOrders: number;
  grossMargin: number;
  customerCount: number;
  ytdRevenue: number;
  lastYearYtdRevenue: number;
  mtdRevenue: number;
  lastMonthRevenue: number;
  wtdRevenue: number;
  todayRevenue: number;
  pipelineValue: number;
  pipelineOrderCount: number;
  conversionRate: number;
  avgOrderValue: number;
  orderQuantity: number;
}

export interface TeamLeaderboard {
  userId: string;
  name: string;
  avatar: string;
  ytdRevenue: number;
  mtdRevenue: number;
  wtdRevenue: number;
  ordersCount: number;
  conversionRate: number;
  contactsReached: number;
  meetingsHeld: number;
  rank: number;
}

export interface AIAutomationTask {
  id: string;
  type: 'vendor_followup' | 'customer_outreach' | 'order_reminder' | 'sample_suggestion';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  scheduledFor: string;
  status: 'pending' | 'approved' | 'sent';
  entityName?: string;
}

export interface NewsAlert {
  id: string;
  headline: string;
  entityName: string;
  entityType: 'customer' | 'vendor';
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  publishedAt: string;
}
