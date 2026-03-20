import { useQuery } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

function getTrendIcon(trend: string): ReactNode {
  switch (trend) {
    case "up":
      return createElement(TrendingUp, { className: "h-4 w-4 text-green-500" });
    case "down":
      return createElement(TrendingDown, { className: "h-4 w-4 text-red-500" });
    default:
      return createElement(Minus, { className: "h-4 w-4 text-gray-500" });
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "needs_attention":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function useTeamPerformance() {
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/team-performance"],
  });

  return {
    teamData,
    isLoading,
    getTrendIcon,
    getStatusColor,
    COLORS,
  };
}
