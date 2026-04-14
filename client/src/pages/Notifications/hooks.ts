import { useState } from "react";
import { useLocation } from "@/lib/wouter-compat";
import {
  useNotifications as useNotificationsQuery,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/services/notifications";
import type { Notification, FilterTab } from "./types";

export function useNotifications() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

  const { data: notifications = [], isLoading } = useNotificationsQuery() as unknown as {
    data: Notification[];
    isLoading: boolean;
  };
  const { data: unreadData } = useUnreadNotificationCount();

  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount = unreadData?.count || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.orderId) {
      navigate(`/projects/${notification.orderId}`);
    }
  };

  const handleDeleteClick = (notification: Notification) => {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (notificationToDelete) {
      deleteMutation.mutate(notificationToDelete.id);
    }
    setNotificationToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setNotificationToDelete(null);
  };

  const handleNavigateToOrder = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const filterTabs: { value: FilterTab; label: string; count?: number }[] = [
    { value: "all", label: "All", count: notifications.length },
    { value: "unread", label: "Unread", count: unreadCount },
    { value: "read", label: "Read", count: notifications.length - unreadCount },
  ];

  return {
    filter,
    setFilter,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    notificationToDelete,
    isLoading,
    unreadCount,
    filteredNotifications,
    filterTabs,
    markAsReadMutation,
    markAllAsReadMutation,
    handleNotificationClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleNavigateToOrder,
  };
}
