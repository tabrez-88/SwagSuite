export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  orderId?: string;
  activityId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
