import { useLocation } from "@/lib/wouter-compat";
import { useProductionAlerts as useProductionAlertsQuery } from "@/services/production";
import type { AlertData, AlertTile } from "./types";

export function useProductionAlerts(onAlertClick?: (filterParam: string) => void) {
  const [, setLocation] = useLocation();

  const { data: alerts, isLoading } = useProductionAlertsQuery<AlertData>();

  const handleTileClick = (tile: AlertTile) => {
    if (onAlertClick) {
      onAlertClick(tile.filterParam);
    } else {
      // Navigate to production report with filter
      setLocation(`/production-report?alertFilter=${tile.filterParam}`);
    }
  };

  return { alerts, isLoading, handleTileClick };
}
