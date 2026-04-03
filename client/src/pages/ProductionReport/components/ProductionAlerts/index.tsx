import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  MessageSquare,
  ShoppingCart,
  Palette,
  Loader2,
} from "lucide-react";
import type { AlertTile, ProductionAlertsProps } from "./types";
import { useProductionAlerts } from "./hooks";

export default function ProductionAlerts({ onAlertClick }: ProductionAlertsProps) {
  const { alerts, isLoading, handleTileClick } = useProductionAlerts(onAlertClick);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading alerts...</span>
      </div>
    );
  }

  if (!alerts) return null;

  const tiles: AlertTile[] = [
    {
      key: "overdue_in_hands",
      label: "Overdue In-Hands",
      count: alerts.overduePOsByInHands,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      filterParam: "overdue_in_hands",
    },
    {
      key: "overdue_next_action",
      label: "Overdue Next Action",
      count: alerts.overduePOsByNextAction,
      icon: <Clock className="h-5 w-5" />,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      filterParam: "overdue_next_action",
    },
    {
      key: "problem",
      label: "Problem POs",
      count: alerts.problemPOs,
      icon: <AlertCircle className="h-5 w-5" />,
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      filterParam: "problem",
    },
    {
      key: "follow_up",
      label: "Follow Up POs",
      count: alerts.followUpPOs,
      icon: <MessageSquare className="h-5 w-5" />,
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      filterParam: "follow_up",
    },
    {
      key: "sos_without_po",
      label: "Awaiting PO Creation",
      count: alerts.sosWithoutPO,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      filterParam: "sos_without_po",
    },
    {
      key: "overdue_proofs",
      label: "Overdue Proofs",
      count: alerts.overdueProofs,
      icon: <Palette className="h-5 w-5" />,
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      filterParam: "overdue_proofs",
    },
  ];

  const activeTiles = tiles.filter((t) => t.count > 0);
  const totalAlerts = activeTiles.reduce((sum, t) => sum + t.count, 0);

  if (totalAlerts === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        All clear — no production alerts
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap gap-3">
      {tiles.map((tile) => (
        <Card
          key={tile.key}
          className={`cursor-pointer flex-1 transition-all hover:shadow-md ${
            tile.count > 0
              ? `${tile.bgColor} ${tile.borderColor} border`
              : "bg-muted/30 border-muted opacity-50"
          }`}
          onClick={() => tile.count > 0 && handleTileClick(tile)}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className={tile.count > 0 ? tile.color : "text-muted-foreground"}>
                {tile.icon}
              </span>
              <span
                className={`text-2xl font-bold ${
                  tile.count > 0 ? tile.color : "text-muted-foreground"
                }`}
              >
                {tile.count}
              </span>
            </div>
            <p
              className={`text-xs font-medium leading-tight ${
                tile.count > 0 ? tile.color : "text-muted-foreground"
              }`}
            >
              {tile.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
