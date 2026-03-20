import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type PortalData, STATUS_MAP, PROGRESS_STEPS } from "./types";

export function useCustomerPortal() {
  const params = useParams();
  const token = params.token || params[0];

  const { data, isLoading, error } = useQuery<PortalData>({
    queryKey: [`/api/portal/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/portal/${token}`);
      if (res.status === 404) throw new Error("not_found");
      if (res.status === 403) {
        const body = await res.json();
        throw new Error(body.message || "expired");
      }
      if (!res.ok) throw new Error("server_error");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Derived values (only computed when data exists)
  const order = data?.order;
  const items = data?.items ?? [];
  const shipments = data?.shipments ?? [];

  const statusInfo = order
    ? STATUS_MAP[order.status] || STATUS_MAP.quote
    : STATUS_MAP.quote;

  // Parse shipping address
  let shippingAddr: any = null;
  if (order?.shippingAddress) {
    try {
      shippingAddr = JSON.parse(order.shippingAddress);
    } catch {
      shippingAddr = { street: order.shippingAddress };
    }
  }

  // Progress index
  const currentStepIdx = order
    ? PROGRESS_STEPS.indexOf(order.status as (typeof PROGRESS_STEPS)[number])
    : -1;
  const activeStep = currentStepIdx >= 0 ? currentStepIdx : 0;

  // Error classification
  const errorMessage = (error as Error)?.message || "";
  const isNotFound = errorMessage.includes("not_found");
  const isExpired = errorMessage.includes("expired") || errorMessage.includes("deactivated");

  return {
    isLoading,
    error,
    order,
    items,
    shipments,
    statusInfo,
    shippingAddr,
    activeStep,
    isNotFound,
    isExpired,
  };
}
