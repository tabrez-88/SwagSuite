import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shippingMethodKeys } from "./keys";
import type { ShippingMethod } from "./types";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: shippingMethodKeys.all });
}

export function useCreateShippingMethod() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createShippingMethod, onSuccess: invalidate });
}

export function useUpdateShippingMethod() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShippingMethod> }) =>
      requests.updateShippingMethod(id, data),
    onSuccess: invalidate,
  });
}

export function useReorderShippingMethods() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.reorderShippingMethods, onSuccess: invalidate });
}

export function useDeleteShippingMethod() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deleteShippingMethod, onSuccess: invalidate });
}
