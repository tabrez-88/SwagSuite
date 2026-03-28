import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import { shipmentKeys } from "./keys";
import * as requests from "./requests";

function useInvalidateShipments(projectId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: shipmentKeys.byOrder(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  };
}

export function useCreateShipment(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateShipments(projectId);
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.createShipment(projectId, data),
    onSuccess: () => { invalidate(); toast({ title: "Shipment created" }); },
    onError: () => toast({ title: "Failed to create shipment", variant: "destructive" }),
  });
}

export function useUpdateShipment(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateShipments(projectId);
  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string | number; data: Record<string, any> }) =>
      requests.updateShipment(projectId, shipmentId, data),
    onSuccess: () => { invalidate(); toast({ title: "Shipment updated" }); },
    onError: () => toast({ title: "Failed to update shipment", variant: "destructive" }),
  });
}

export function useDeleteShipment(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateShipments(projectId);
  return useMutation({
    mutationFn: (shipmentId: string | number) => requests.deleteShipment(projectId, shipmentId),
    onSuccess: () => { invalidate(); toast({ title: "Shipment removed" }); },
    onError: () => toast({ title: "Failed to remove shipment", variant: "destructive" }),
  });
}
