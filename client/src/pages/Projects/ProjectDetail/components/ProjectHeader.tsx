import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/shared/StageBadge";
import { EditableText } from "@/components/shared/InlineEditable";
import { FileText, X, Zap } from "lucide-react";
import { useLocation } from "@/lib/wouter-compat";
import type { Order } from "@shared/schema";
import type { DeterminedStage } from "@/constants/businessStages";
import { Separator } from "@/components/ui/separator";

interface ProjectHeaderProps {
  order: Order;
  isRushOrder: boolean;
  businessStage?: DeterminedStage;
  updateField: (fields: Record<string, unknown>) => void;
  isPending: boolean;
}

export default function ProjectHeader({
  order,
  isRushOrder,
  businessStage,
  updateField,
  isPending,
}: ProjectHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="flex gap-2 items-center w-200">
          <FileText className="size-8" />
          <div className="flex flex-col">
            <EditableText
              value={order.projectName || ""}
              field="projectName"
              onSave={updateField}
              placeholder={`Project #${order.orderNumber}`}
              emptyText={`Project #${order.orderNumber}`}
              isPending={isPending}
              className="text-xl font-semibold"
            />
            {order.projectName && (
              <span className="text-sm text-muted-foreground">
                #{order.orderNumber}
              </span>
            )}
          </div>
        </div>
        <Separator orientation="vertical" className="h-12" />
        {businessStage && <StageBadge stage={businessStage} size="md" />}
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
