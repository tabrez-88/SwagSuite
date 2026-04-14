import { useParams } from "@/lib/wouter-compat";
import { useCustomerPortalData } from "@/services/customer-portal";
import { type PortalData, STATUS_MAP, PROGRESS_STEPS } from "./types";

export function useCustomerPortal() {
  const params = useParams();
  const token = params.token || params[0];

  const { data, isLoading, error } = useCustomerPortalData<PortalData>(token);

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
