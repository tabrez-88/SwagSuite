import { apiRequest } from "@/lib/queryClient";
import type { Notification, UnreadCount } from "./types";

export async function fetchNotifications(limit?: number): Promise<Notification[]> {
  const url = limit ? `/api/notifications?limit=${limit}` : "/api/notifications";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function fetchUnreadCount(): Promise<UnreadCount> {
  const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch unread count");
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
  const res = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete notification");
}
