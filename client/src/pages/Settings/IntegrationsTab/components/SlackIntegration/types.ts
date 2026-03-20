export interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  isArchived: boolean;
}

export interface SlackConfig {
  enabled: boolean;
  botToken: string;
  channelId: string;
  notifications: {
    newOrders: boolean;
    orderUpdates: boolean;
    customerMessages: boolean;
    supplierAlerts: boolean;
    teamMentions: boolean;
  };
}
