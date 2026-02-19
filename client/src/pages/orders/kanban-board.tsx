import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { format } from "date-fns";
import { Calendar, DollarSign, GripVertical } from "lucide-react";
import type { Order } from "@shared/schema";
import type { OrderWithRelations } from "./columns";

const kanbanColumns = [
  { id: "quote", label: "Quote", color: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  { id: "pending_approval", label: "Pending Approval", color: "bg-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  { id: "approved", label: "Approved", color: "bg-green-500", bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  { id: "in_production", label: "In Production", color: "bg-purple-500", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { id: "shipped", label: "Shipped", color: "bg-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  { id: "delivered", label: "Delivered", color: "bg-gray-500", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-500", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
] as const;

interface KanbanBoardProps {
  data: OrderWithRelations[];
  onViewOrder: (order: Order) => void;
  onViewProject: (orderId: string) => void;
}

export function KanbanBoard({ data, onViewOrder, onViewProject }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draggedOrder, setDraggedOrder] = useState<OrderWithRelations | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const getOrdersByStatus = (status: string) =>
    data.filter((o) => o.status === status);

  const handleDragStart = (e: React.DragEvent, order: OrderWithRelations) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", order.id);
    // Make drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedOrder(null);
    setDragOverColumn(null);
    dragCounterRef.current = {};
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] || 0) + 1;
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] || 0) - 1;
    if (dragCounterRef.current[columnId] <= 0) {
      dragCounterRef.current[columnId] = 0;
      if (dragOverColumn === columnId) {
        setDragOverColumn(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    dragCounterRef.current = {};

    if (draggedOrder && draggedOrder.status !== columnId) {
      updateStatusMutation.mutate({
        orderId: draggedOrder.id,
        newStatus: columnId,
      });
    }
    setDraggedOrder(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto p-4" style={{ minHeight: "500px" }}>
      {kanbanColumns.map((col) => {
        const orders = getOrdersByStatus(col.id);
        const isOver = dragOverColumn === col.id && draggedOrder?.status !== col.id;

        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-[260px] flex flex-col rounded-lg border ${
              isOver ? `${col.border} ${col.bg} ring-2 ring-offset-1 ring-${col.color}` : "border-gray-200 bg-gray-50/50"
            } transition-all duration-150`}
            onDragEnter={(e) => handleDragEnter(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-[20px] justify-center">
                  {orders.length}
                </Badge>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-340px)]">
              {orders.length === 0 && (
                <div className={`text-center py-8 text-xs text-gray-400 ${isOver ? "opacity-0" : ""}`}>
                  No orders
                </div>
              )}
              {isOver && draggedOrder?.status !== col.id && (
                <div className={`border-2 border-dashed ${col.border} rounded-lg p-4 text-center text-xs ${col.text}`}>
                  Drop here to move to {col.label}
                </div>
              )}
              {orders.map((order) => (
                <Card
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, order)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onViewOrder(order)}
                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow border ${
                    draggedOrder?.id === order.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {order.orderNumber}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <UserAvatar name={order.companyName || "?"} size="xs" />
                          <p className="text-xs text-gray-600 truncate">{order.companyName}</p>
                        </div>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Order Type */}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {(order.orderType as string)?.replace("_", " ").toUpperCase() || "QUOTE"}
                    </Badge>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium text-gray-700">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                          }).format(Number(order.total || 0))}
                        </span>
                      </div>
                      {order.inHandsDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(order.inHandsDate), "MMM dd")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
