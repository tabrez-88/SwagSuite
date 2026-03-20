import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useToast } from "@/hooks/use-toast";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { getDateStatus } from "@/lib/dateUtils";
import type { OverviewSectionProps } from "./types";

export function useOverviewSection({ orderId, data, isLocked = false }: OverviewSectionProps) {
  const {
    order,
    orderItems,
    companyName,
    primaryContact,
    assignedUser,
    csrUser,
    teamMembers,
  } = data;

  const { stages: productionStages } = useProductionStages();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openPopover, setOpenPopover] = useState<"salesRep" | "csr" | null>(null);

  const { updateField, isPending } = useInlineEdit({ orderId, isLocked });

  const reassignMutation = useMutation({
    mutationFn: async ({ field, userId }: { field: "assignedUserId" | "csrUserId"; userId: string | null }) => {
      const { apiRequest } = await import("@/lib/queryClient");
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, { [field]: userId });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      const label = variables.field === "assignedUserId" ? "Sales Rep" : "CSR";
      toast({ title: `${label} updated` });
      setOpenPopover(null);
    },
    onError: () => {
      toast({ title: "Failed to update assignment", variant: "destructive" });
    },
  });

  const renderDateBadge = (dateValue: string) => {
    const ds = getDateStatus(dateValue);
    return ds;
  };

  // Production stages computation
  const poDocuments = ((data as any)?.documents || []).filter((d: any) => d.documentType === "purchase_order");
  const stageOrder = productionStages
    ? new Map(productionStages.map((s: any, i: number) => [s.id, i]))
    : new Map();

  const reachedStages = new Set<string>();
  if (productionStages) {
    for (const po of poDocuments) {
      const poStage = po.metadata?.poStage || "created";
      const poStageIdx = stageOrder.get(poStage) ?? -1;
      for (const [stageId, idx] of stageOrder) {
        if (idx <= poStageIdx) reachedStages.add(stageId);
      }
    }
  }

  const completedStageCount = reachedStages.size;
  const currentStageId = productionStages?.find((s: any) => !reachedStages.has(s.id))?.id || "";
  const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  return {
    // Data
    order,
    orderItems,
    companyName,
    primaryContact,
    assignedUser,
    csrUser,
    teamMembers,
    data,
    orderId,
    isLocked,

    // Hooks
    updateField,
    isPending,
    reassignMutation,
    openPopover,
    setOpenPopover,

    // Production
    productionStages,
    poDocuments,
    reachedStages,
    completedStageCount,
    currentStageId,

    // Helpers
    renderDateBadge,
    totalQuantity,
  };
}
