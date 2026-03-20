import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { AlertData, AlertTile } from "./types";

export function useProductionAlerts(onAlertClick?: (filterParam: string) => void) {
  const [, setLocation] = useLocation();

  const { data: alerts, isLoading } = useQuery<AlertData>({
    queryKey: ["/api/production/alerts"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

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
