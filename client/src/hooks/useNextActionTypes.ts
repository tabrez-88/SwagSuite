import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface NextActionType {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string | null;
  icon: string;
  isActive?: boolean | null;
}

export const DEFAULT_ACTION_TYPES: NextActionType[] = [
  { id: 'no_action', name: 'No Action Required', order: 1, color: 'bg-gray-100 text-gray-700', icon: 'Circle' },
  { id: 'follow_up_vendor', name: 'Follow Up with Vendor', order: 2, color: 'bg-blue-100 text-blue-800', icon: 'Phone' },
  { id: 'request_proof', name: 'Request Proof', order: 3, color: 'bg-purple-100 text-purple-800', icon: 'Image' },
  { id: 'review_proof', name: 'Review Proof', order: 4, color: 'bg-indigo-100 text-indigo-800', icon: 'Eye' },
  { id: 'waiting_approval', name: 'Waiting for Approval', order: 5, color: 'bg-yellow-100 text-yellow-800', icon: 'Clock' },
  { id: 'confirm_ship_date', name: 'Confirm Ship Date', order: 6, color: 'bg-cyan-100 text-cyan-800', icon: 'Calendar' },
  { id: 'request_tracking', name: 'Request Tracking', order: 7, color: 'bg-emerald-100 text-emerald-800', icon: 'Truck' },
  { id: 'check_production', name: 'Check Production Status', order: 8, color: 'bg-orange-100 text-orange-800', icon: 'Factory' },
  { id: 'review_invoice', name: 'Review Invoice', order: 9, color: 'bg-red-100 text-red-800', icon: 'Receipt' },
];

const QUERY_KEY = ["/api/production/next-action-types"];

export function useNextActionTypes() {
  const queryClient = useQueryClient();

  const { data: actionTypes = DEFAULT_ACTION_TYPES, isLoading } = useQuery<NextActionType[]>({
    queryKey: QUERY_KEY,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (type: { name: string; description?: string; color: string; icon: string }) => {
      const res = await apiRequest("POST", "/api/production/next-action-types", type);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; color?: string; icon?: string }) => {
      const res = await apiRequest("PUT", `/api/production/next-action-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/production/next-action-types/${id}`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (typeIds: string[]) => {
      const res = await apiRequest("POST", "/api/production/next-action-types/reorder", { typeIds });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/production/next-action-types/reset");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    actionTypes,
    isLoading,
    createType: createMutation.mutateAsync,
    updateType: updateMutation.mutateAsync,
    deleteType: deleteMutation.mutateAsync,
    reorderTypes: reorderMutation.mutateAsync,
    resetTypes: resetMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isResetting: resetMutation.isPending,
  };
}

export function getActionTypeBadgeClass(types: NextActionType[], typeId: string): string {
  const type = types.find(t => t.id === typeId);
  return type ? `${type.color} border-0` : 'bg-gray-100 text-gray-700 border-0';
}
