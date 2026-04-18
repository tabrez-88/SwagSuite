import { apiRequest } from "@/lib/queryClient";
import type { Notification, UnreadCount } from "./types";

export async function fetchNotifications(limit?: number): Promise<Notification[]> {
  const url = limit ? `/api/notifications?limit=${limit}` : "/api/notifications";
  const res = await apiRequest("GET", url);
  return res.json();
}

export async function fetchUnreadCount(): Promise<UnreadCount> {
  const res = await apiRequest("GET", "/api/notifications/unread-count");
  return res.json();
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
  return res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("POST", "/api/notifications/mark-all-read");
}

export async function deleteNotification(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/notifications/${id}`);
}
