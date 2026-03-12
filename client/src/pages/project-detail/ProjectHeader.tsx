import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/StageBadge";
import { FileText, X, Zap } from "lucide-react";
import { useLocation } from "wouter";
import type { Order } from "@shared/schema";
import type { DeterminedStage } from "@/lib/businessStages";

interface ProjectHeaderProps {
  order: Order;
  isRushOrder: boolean;
  businessStage?: DeterminedStage;
}

export default function ProjectHeader({
  order,
  isRushOrder,
  businessStage,
}: ProjectHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="w-6 h-6" />
        <h2 className="text-lg font-semibold">
          {order.projectName || `Project #${order.orderNumber}`}
        </h2>
        {order.projectName && (
          <span className="text-sm text-muted-foreground">#{order.orderNumber}</span>
        )}
        {businessStage && (
          <StageBadge stage={businessStage} size="sm" />
        )}
        {isRushOrder && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            RUSH
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/projects")}
          className="ml-auto"
        >
          <X className="w-4 h-4" />
          Close
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Full project details, communications, and workflow management
      </p>
    </div>
  );
}
