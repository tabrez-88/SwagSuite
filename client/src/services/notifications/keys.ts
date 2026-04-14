export const notificationKeys = {
  all: ["/api/notifications"] as const,
  list: ["/api/notifications/all"] as const,
  preview: (limit?: number) => ["/api/notifications", { limit }] as const,
  unreadCount: ["/api/notifications/unread-count"] as const,
};
