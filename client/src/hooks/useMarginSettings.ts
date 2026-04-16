import { useQuery } from "@tanstack/react-query";
import type { MarginSettings } from "@/types/margin-types";

// Re-export for backward compatibility
export type { MarginSettings } from "@/types/margin-types";
export { marginColorClass, marginBgClass, isBelowMinimum, calcMarginPercent, applyMargin } from "@/lib/margin";

const DEFAULTS: MarginSettings = {
  minimumMargin: 42,
  defaultMargin: 42,
};

export function useMarginSettings(): MarginSettings {
  const { data } = useQuery<any>({
    queryKey: ["/api/admin/settings"],
    staleTime: 5 * 60 * 1000, // 5 min
  });

  if (!data) return DEFAULTS;

  return {
    minimumMargin: parseFloat(data.minimumMargin || "42"),
    defaultMargin: parseFloat(data.defaultMargin || "42"),
  };
}
