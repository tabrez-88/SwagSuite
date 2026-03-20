export interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  isArchived: boolean;
}

export interface SlackMessage {
  id: string;
  content: string;
  user: string;
  timestamp: string;
  channel: string;
}

export interface SlackNotificationSettings {
  orderUpdates: boolean;
  customerAlerts: boolean;
  vendorReminders: boolean;
  teamAnnouncements: boolean;
  errorAlerts: boolean;
  defaultChannel: string;
}
