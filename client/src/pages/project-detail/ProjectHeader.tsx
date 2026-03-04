import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/StageBadge";
import { FileText, X, Zap } from "lucide-react";
import { useLocation } from "wouter";
import type { Order } from "@shared/schema";
import type { DeterminedStage } from "@/lib/businessStages";

interface ProjectHeaderProps {
  order: Order;
  statusLabel: string;
  statusClass: string;
  isRushOrder: boolean;
  businessStage?: DeterminedStage;
  onEditOrder: () => void;
}

export default function ProjectHeader({
  order,
  statusLabel,
  statusClass,
  isRushOrder,
  businessStage,
  onEditOrder,
}: ProjectHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="w-6 h-6" />
        <h2 className="text-lg font-semibold">Project #{order.orderNumber}</h2>
        {businessStage ? (
          <StageBadge stage={businessStage} size="sm" />
        ) : (
          <Badge className={statusClass}>{statusLabel}</Badge>
        )}
        {isRushOrder && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            RUSH
          </Badge>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={onEditOrder}
          className="ml-auto"
        >
          Edit Project
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/projects")}
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
