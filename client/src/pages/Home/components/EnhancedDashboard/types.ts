export interface DashboardMetrics {
  // Legacy from getStats()
  totalRevenue: number;
  activeOrders: number;
  customerCount: number;
  // Per-range revenue
  ytdRevenue: number;
  mtdRevenue: number;
  wtdRevenue: number;
  todayRevenue: number;
  // Comparison revenue
  lastYearYtdRevenue: number;
  lastMonthRevenue: number;
  lastWeekRevenue: number;
  yesterdayRevenue: number;
  // Per-range margin
  ytdMargin: number;
  mtdMargin: number;
  wtdMargin: number;
  todayMargin: number;
  // Comparison margin
  lastYearYtdMargin: number;
  lastMonthMargin: number;
  lastWeekMargin: number;
  yesterdayMargin: number;
  // Per-range avg order value
  ytdAvgOrderValue: number;
  mtdAvgOrderValue: number;
  wtdAvgOrderValue: number;
  todayAvgOrderValue: number;
  // Comparison avg order value
  lastYearYtdAvgOrderValue: number;
  lastMonthAvgOrderValue: number;
  lastWeekAvgOrderValue: number;
  yesterdayAvgOrderValue: number;
  // Per-range order quantity
  ytdOrderQuantity: number;
  mtdOrderQuantity: number;
  wtdOrderQuantity: number;
  todayOrderQuantity: number;
  // Comparison order quantity
  lastYearYtdOrderQuantity: number;
  lastMonthOrderQuantity: number;
  lastWeekOrderQuantity: number;
  yesterdayOrderQuantity: number;
  // Legacy
  grossMargin: number;
  avgOrderValue: number;
  orderQuantity: number;
  conversionRate: number;
  pipelineValue: number;
  pipelineOrderCount: number;
}

export interface TeamLeaderboard {
  userId: string;
  name: string;
  email: string;
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

export interface RecentActivity {
  id: string;
  activityType: string;
  content: string;
  createdAt: string;
  isSystemGenerated: boolean;
  userName: string;
  orderId: string;
  orderNumber: string | null;
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
