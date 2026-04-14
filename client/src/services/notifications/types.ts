export interface Notification {
  id: string;
  title: string;
  message?: string;
  isRead: boolean;
  orderId?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface UnreadCount {
  count: number;
}
