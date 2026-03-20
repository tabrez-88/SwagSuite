import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  Package,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNotifications } from "./hooks";

const notificationIcons: Record<string, React.ReactNode> = {
  artwork_approved: <FileCheck className="h-5 w-5 text-green-600" />,
  artwork_declined: <AlertTriangle className="h-5 w-5 text-red-600" />,
  artwork_pending: <Package className="h-5 w-5 text-yellow-600" />,
  order_update: <Package className="h-5 w-5 text-blue-600" />,
  mention: <MessageSquare className="h-5 w-5 text-purple-600" />,
  vendor_approval: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  team_update: <Users className="h-5 w-5 text-indigo-600" />,
  quote_approved: <CheckCheck className="h-5 w-5 text-green-600" />,
  quote_declined: <AlertTriangle className="h-5 w-5 text-red-600" />,
  default: <Bell className="h-5 w-5 text-gray-600" />,
};

const getIcon = (type: string) => {
  return notificationIcons[type] || notificationIcons.default;
};

export default function NotificationsPage() {
  const {
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
  } = useNotifications();

  return (
    <div className="space-y-6 p-6 pb-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Stay updated on your orders, artwork approvals, and team activity
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.value)}
            className={filter === tab.value ? "bg-swag-primary hover:bg-swag-primary/90" : ""}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <Badge
                variant="secondary"
                className={`ml-2 h-5 px-1.5 text-xs ${
                  filter === tab.value
                    ? "bg-white/20 text-white"
                    : ""
                }`}
              >
                {tab.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swag-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications yet"}
            </h3>
            <p className="text-gray-600">
              {filter === "unread"
                ? "You're all caught up!"
                : "Notifications will appear here when there's activity on your orders."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 p-2 rounded-full bg-gray-100">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold ${!notification.isRead ? "text-gray-900" : "text-gray-600"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Badge className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {notification.orderId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View order"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToOrder(notification.orderId!);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(notification);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Notification
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification?
              {notificationToDelete && (
                <span className="block mt-1 font-medium text-foreground">
                  "{notificationToDelete.title}"
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
