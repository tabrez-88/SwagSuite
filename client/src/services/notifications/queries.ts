import { useQuery } from "@tanstack/react-query";
import { notificationKeys } from "./keys";
import * as requests from "./requests";
import type { Notification, UnreadCount } from "./types";

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: notificationKeys.list,
    queryFn: () => requests.fetchNotifications(),
  });
}

export function useUnreadNotificationCount(refetchInterval?: number) {
  return useQuery<UnreadCount>({
    queryKey: notificationKeys.unreadCount,
    queryFn: requests.fetchUnreadCount,
    refetchInterval,
  });
}

export function useNotificationPreview(limit = 20, enabled = true) {
  return useQuery<Notification[]>({
    queryKey: notificationKeys.preview(limit),
    queryFn: () => requests.fetchNotifications(limit),
    enabled,
  });
}
