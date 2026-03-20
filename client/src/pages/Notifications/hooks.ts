import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Notification, FilterTab } from "./types";

export function useNotifications() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/all"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/all"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: invalidateAll,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete notification");
    },
    onSuccess: invalidateAll,
  });

  const unreadCount = unreadData?.count || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
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

  const handleNavigateToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
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
