import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/shared/StageBadge";
import { FileText, X, Zap } from "lucide-react";
import { useLocation } from "wouter";
import type { Order } from "@shared/schema";
import type { DeterminedStage } from "@/constants/businessStages";
import { Separator } from "@/components/ui/separator";

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
        <div className="flex gap-2 items-center">
          <FileText className="size-8" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">
              {order.projectName || `Project #${order.orderNumber}`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Full project details, communications, and workflow management
            </p>
          </div>
        </div>
        <Separator orientation="vertical" className="h-12" />
        {order.projectName && (
          <span className="text-sm text-muted-foreground">#{order.orderNumber}</span>
        )}
        {businessStage && (
          <StageBadge stage={businessStage} size="md" />
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
          onClick={() => setLocation("/projects")}
          className="ml-auto"
        >
          <X className="w-4 h-4" />
          Close
        </Button>
      </div>

    </div>
  );
}
