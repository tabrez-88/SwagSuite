import { useQuery } from "@tanstack/react-query";
import { shippingMethodKeys } from "./keys";
import type { ShippingMethod } from "./types";

export function useShippingMethods() {
  return useQuery<ShippingMethod[]>({
    queryKey: shippingMethodKeys.all,
  });
}

/** Returns methods filtered by courier type */
export function useShippingMethodsByCourier(courier: string | undefined) {
  const { data: methods = [], ...rest } = useShippingMethods();
  const filtered = courier
    ? methods.filter((m) => m.courier === courier || m.courier === "other")
    : methods;
  return { data: filtered, ...rest };
}
