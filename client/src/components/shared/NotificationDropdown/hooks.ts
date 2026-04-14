import { useState } from "react";
import { useLocation } from "@/lib/wouter-compat";
import {
  useNotificationPreview,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/services/notifications";
import type { Notification } from "./types";

export function useNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [, navigate] = useLocation();

  // Poll unread count every 30s so the badge refreshes even while sidebar closed.
  const { data: unreadData } = useUnreadNotificationCount(30_000);

  const { data: notifications = [], isLoading } = useNotificationPreview(20, isOpen) as unknown as {
    data: Notification[];
    isLoading: boolean;
  };

  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount = unreadData?.count || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.orderId) {
      setIsOpen(false);
      navigate(`/projects/${notification.orderId}`);
    }
  };

  const handleDeleteConfirm = () => {
    if (notificationToDelete) {
      deleteMutation.mutate(notificationToDelete.id);
    }
    setNotificationToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteRequest = (notification: Notification) => {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleNavigateToProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  return {
    isOpen,
    setIsOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    notificationToDelete,
    setNotificationToDelete,
    notifications,
    isLoading,
    unreadCount,
    markAsReadMutation,
    markAllAsReadMutation,
    handleNotificationClick,
    handleDeleteConfirm,
    handleDeleteRequest,
    handleNavigateToProject,
    handleViewAll,
  };
}
