import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StageBadge } from "@/components/shared/StageBadge";
import { format } from "date-fns";
import { AlertTriangle, Calendar, DollarSign, GripVertical } from "lucide-react";
import { getDateStatus } from "@/lib/dateUtils";
import type { Order } from "@shared/schema";
import type { OrderWithRelations } from "./columns";
import {
  BUSINESS_STAGES,
  STAGE_ORDER,
  determineBusinessStage,
  getStageTransitionPayload,
  type BusinessStage,
} from "@/constants/businessStages";

const kanbanStages = STAGE_ORDER.map((id) => BUSINESS_STAGES[id]);

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

  const updateStageMutation = useMutation({
    mutationFn: async ({ orderId, targetStage }: { orderId: string; targetStage: BusinessStage }) => {
      const payload = getStageTransitionPayload(targetStage);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update stage");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      toast({ title: "Stage updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update stage", variant: "destructive" });
    },
  });

  const getOrdersByStage = (stageId: BusinessStage) =>
    data.filter((o) => {
      const determined = o._determinedStage || determineBusinessStage(o);
      return determined.stage.id === stageId;
    });

  const getOrderStageId = (order: OrderWithRelations): BusinessStage => {
    const determined = order._determinedStage || determineBusinessStage(order);
    return determined.stage.id;
  };

  const handleDragStart = (e: React.DragEvent, order: OrderWithRelations) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", order.id);
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

    if (draggedOrder && getOrderStageId(draggedOrder) !== columnId) {
      updateStageMutation.mutate({
        orderId: draggedOrder.id,
        targetStage: columnId as BusinessStage,
      });
    }
    setDraggedOrder(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto p-4" style={{ minHeight: "500px" }}>
      {kanbanStages.map((stageConfig) => {
        const orders = getOrdersByStage(stageConfig.id);
        const draggedStageId = draggedOrder ? getOrderStageId(draggedOrder) : null;
        const isOver = dragOverColumn === stageConfig.id && draggedStageId !== stageConfig.id;

        return (
          <div
            key={stageConfig.id}
            className={`flex-shrink-0 w-[280px] flex flex-col rounded-lg border ${
              isOver
                ? `${stageConfig.borderColor} ${stageConfig.bgLight} ring-2 ring-offset-1`
                : "border-gray-200 bg-gray-50/50"
            } transition-all duration-150`}
            onDragEnter={(e) => handleDragEnter(e, stageConfig.id)}
            onDragLeave={(e) => handleDragLeave(e, stageConfig.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stageConfig.id)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${stageConfig.color} ${stageConfig.textColor}`}
                  >
                    {stageConfig.abbreviation}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{stageConfig.label}</span>
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
              {isOver && draggedStageId !== stageConfig.id && (
                <div className={`border-2 border-dashed ${stageConfig.borderColor} rounded-lg p-4 text-center text-xs`}>
                  Drop here to move to {stageConfig.label}
                </div>
              )}
              {orders.map((order) => {
                const determined = order._determinedStage || determineBusinessStage(order);
                const draggedOrderStageId = draggedOrder ? getOrderStageId(draggedOrder) : null;

                return (
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
                            {order.projectName || order.orderNumber}
                          </p>
                          {order.projectName && (
                            <p className="text-[10px] text-gray-400 truncate">{order.orderNumber}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <UserAvatar name={order.companyName || "?"} size="xs" />
                            <p className="text-xs text-gray-600 truncate">{order.companyName}</p>
                          </div>
                        </div>
                        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>

                      {/* Sub-status badge & budget */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] ${determined.currentSubStatus.color} inline-block px-1.5 py-0.5 rounded-full font-medium`}
                        >
                          {determined.currentSubStatus.label}
                        </span>
                        {order.budget && Number(order.budget) > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 inline-block px-1.5 py-0.5 rounded-full font-medium">
                            Budget: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(Number(order.budget))}
                          </span>
                        )}
                      </div>

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
                        {order.inHandsDate && (() => {
                          const dateStatus = getDateStatus(order.inHandsDate);
                          const urgencyClass = dateStatus?.urgency === 'overdue' ? 'text-red-600 font-semibold'
                            : dateStatus?.urgency === 'today' ? 'text-red-500 font-medium'
                            : dateStatus?.urgency === 'urgent' ? 'text-orange-500'
                            : '';
                          return (
                            <div className={`flex items-center gap-1 ${urgencyClass}`}>
                              {dateStatus?.urgency === 'overdue' ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                              <span>{format(new Date(order.inHandsDate), "MMM dd")}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
