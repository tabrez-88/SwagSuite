import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { orderKeys } from "@/services/orders/keys";
import { shipmentKeys } from "./keys";
import * as requests from "./requests";

function useInvalidateShipments(orderId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: shipmentKeys.byOrder(orderId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
  };
}

export function useCreateShipment(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateShipments(orderId);
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.createShipment(orderId, data),
    onSuccess: () => { invalidate(); toast({ title: "Shipment created" }); },
    onError: () => toast({ title: "Failed to create shipment", variant: "destructive" }),
  });
}

export function useUpdateShipment(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateShipments(orderId);
  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string | number; data: Record<string, any> }) =>
      requests.updateShipment(orderId, shipmentId, data),
    onSuccess: () => { invalidate(); toast({ title: "Shipment updated" }); },
    onError: () => toast({ title: "Failed to update shipment", variant: "destructive" }),
  });
}

export function useDeleteShipment(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateShipments(orderId);
  return useMutation({
    mutationFn: (shipmentId: string | number) => requests.deleteShipment(orderId, shipmentId),
    onSuccess: () => { invalidate(); toast({ title: "Shipment removed" }); },
    onError: () => toast({ title: "Failed to remove shipment", variant: "destructive" }),
  });
}
