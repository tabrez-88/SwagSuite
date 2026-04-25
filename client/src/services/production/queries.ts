import { useQuery } from "@tanstack/react-query";
import { DEFAULT_STAGES } from "@/constants/productionStages";
import { productionKeys } from "./keys";
import type { ProductionStage, NextActionType } from "./types";
import * as requests from "./requests";

const STALE = 5 * 60 * 1000; // 5 minutes

export function useProductionStagesQuery() {
  return useQuery<ProductionStage[]>({
    queryKey: productionKeys.stages,
    queryFn: requests.fetchStages,
    staleTime: STALE,
    placeholderData: DEFAULT_STAGES,
  });
}

export const DEFAULT_ACTION_TYPES: NextActionType[] = [
  { id: "no_action", name: "No Action Required", order: 1, color: "bg-gray-100 text-gray-700", icon: "Circle" },
  { id: "follow_up_vendor", name: "Follow Up with Vendor", order: 2, color: "bg-blue-100 text-blue-800", icon: "Phone" },
  { id: "request_proof", name: "Request Proof", order: 3, color: "bg-purple-100 text-purple-800", icon: "Image" },
  { id: "review_proof", name: "Review Proof", order: 4, color: "bg-indigo-100 text-indigo-800", icon: "Eye" },
  { id: "waiting_approval", name: "Waiting for Approval", order: 5, color: "bg-yellow-100 text-yellow-800", icon: "Clock" },
  { id: "confirm_ship_date", name: "Confirm Ship Date", order: 6, color: "bg-cyan-100 text-cyan-800", icon: "Calendar" },
  { id: "request_tracking", name: "Request Tracking", order: 7, color: "bg-emerald-100 text-emerald-800", icon: "Truck" },
  { id: "check_production", name: "Check Production Status", order: 8, color: "bg-orange-100 text-orange-800", icon: "Factory" },
  { id: "review_invoice", name: "Review Invoice", order: 9, color: "bg-red-100 text-red-800", icon: "Receipt" },
];

export function useNextActionTypesQuery() {
  return useQuery<NextActionType[]>({
    queryKey: productionKeys.nextActionTypes,
    queryFn: requests.fetchActionTypes,
    staleTime: STALE,
    placeholderData: DEFAULT_ACTION_TYPES,
  });
}

export function getActionTypeBadgeClass(types: NextActionType[], typeId: string): string {
  const type = types.find((t) => t.id === typeId);
  return type ? `${type.color} border-0` : "bg-gray-100 text-gray-700 border-0";
}

export function usePoReport<T = any>(queryParams: string) {
  return useQuery<T>({
    queryKey: productionKeys.poReport(queryParams),
    queryFn: () => requests.fetchPoReport(queryParams),
  });
}

export function useProductionAlerts<T = any>() {
  return useQuery<T>({ queryKey: productionKeys.alerts });
}

export function usePoReportDetail<T = any>(documentId: string | null | undefined, enabled = true) {
  return useQuery<T>({
    queryKey: productionKeys.poReportDetail(documentId ?? ""),
    enabled: !!documentId && enabled,
  });
}
