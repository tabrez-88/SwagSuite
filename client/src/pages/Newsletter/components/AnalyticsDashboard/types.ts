export interface AnalyticsData {
  period: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  revenue: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  sentDate: string;
  recipients: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  revenue: number;
}

export interface SubjectLineTest {
  id: string;
  subjectA: string;
  subjectB: string;
  winningSide: "A" | "B";
  openRateA: number;
  openRateB: number;
  improvement: number;
}

export interface DeviceData {
  name: string;
  value: number;
  color: string;
}

export interface EngagementData {
  period: string;
  subscribers: number;
  active: number;
  engaged: number;
}
