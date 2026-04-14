import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.markNotificationRead, onSuccess: invalidate });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.markAllNotificationsRead, onSuccess: invalidate });
}

export function useDeleteNotification() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deleteNotification, onSuccess: invalidate });
}
