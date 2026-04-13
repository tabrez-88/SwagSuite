import { useState, useMemo } from "react";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { getDateStatus } from "@/lib/dateUtils";
import { useReassignProject } from "@/services/projects/mutations";
import type { OverviewSectionProps } from "./types";

/**
 * OverviewSection Hook
 * 
 * Responsibilities:
 * - Extract data from props (already in ProjectData)
 * - Handle user assignment mutations
 * - Track UI state (popovers)
 * - Compute production pipeline progress
 * - Provide date formatting utilities
 */
export function useOverviewSection({ projectId, data, isLocked = false }: OverviewSectionProps) {
  // ── 1. DATA from props ──
  const {
    order,
    orderItems,
    companyName,
    primaryContact,
    assignedUser,
    csrUser,
    teamMembers,
  } = data;

  // ── 2. HOOKS & QUERIES ──
  const { stages: productionStages } = useProductionStages();

  // ── 3. MUTATIONS ──
  const { updateField, isPending } = useInlineEdit({ projectId, isLocked });
  const _reassignMutation = useReassignProject(projectId);

  // ── 4. UI STATE ──
  const [openPopover, setOpenPopover] = useState<"salesRep" | "csr" | null>(null);

  // Wrap service mutation to close popover on success
  const reassignMutation = useMemo(() => ({
    ..._reassignMutation,
    mutate: (vars: Parameters<typeof _reassignMutation.mutate>[0], opts?: Parameters<typeof _reassignMutation.mutate>[1]) =>
      _reassignMutation.mutate(vars, { ...opts, onSuccess: (...args) => { setOpenPopover(null); opts?.onSuccess?.(...args); } }),
  }), [_reassignMutation]);

  // ── 5. COMPUTED VALUES ──
  
  /**
   * Calculate production pipeline progress
   * Based on highest PO stage reached
   */
  const { completedStageCount, currentStageId, poDocuments, reachedStages } = computeProductionProgress(
    data as any,
    productionStages
  );

  /** Total quantity across all items */
  const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  // ── 6. RETURN ORGANIZED ──
  return {
    // Data (from props)
    order,
    orderItems,
    companyName,
    primaryContact,
    assignedUser,
    csrUser,
    teamMembers,

    // Mutations & Updates
    updateField,
    reassignMutation,
    isPending,

    // UI State
    openPopover,
    setOpenPopover,

    // Production Progress
    productionStages,
    poDocuments,
    reachedStages,
    completedStageCount,
    currentStageId,

    // Utilities
    renderDateBadge,
    
    // Computed
    totalQuantity,
    projectId,
    isLocked,
    data,
  };
}

/**
 * Helper: Compute production pipeline progress
 * Determines which production stages have been completed based on PO stages
 */
function computeProductionProgress(data: any, productionStages: any[]) {
  const poDocuments = (data?.documents || []).filter((d: any) => d.documentType === "purchase_order");
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

  return {
    poDocuments,
    reachedStages,
    completedStageCount: reachedStages.size,
    currentStageId: productionStages?.find((s: any) => !reachedStages.has(s.id))?.id || "",
  };
}

/**
 * Helper: Render date badge
 * Delegates to centralized dateUtils
 */
function renderDateBadge(dateValue: string) {
  return getDateStatus(dateValue);
}
