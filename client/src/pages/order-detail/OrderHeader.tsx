import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, X, Zap } from "lucide-react";
import { useLocation } from "wouter";
import type { Order } from "@shared/schema";

interface OrderHeaderProps {
  order: Order;
  statusLabel: string;
  statusClass: string;
  isRushOrder: boolean;
  onEditOrder: () => void;
}

export default function OrderHeader({
  order,
  statusLabel,
  statusClass,
  isRushOrder,
  onEditOrder,
}: OrderHeaderProps) {
  const [, setLocation] = useLocation();

  const handleViewProject = () => {
    setLocation(`/project/${order.id}`);
  };

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="w-6 h-6" />
        <h2 className="text-lg font-semibold">Order #{order.orderNumber}</h2>
        <Badge className={statusClass}>{statusLabel}</Badge>
        {isRushOrder && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            RUSH ORDER
          </Badge>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={onEditOrder}
          className="ml-auto"
        >
          Edit Order
        </Button>
        <Button variant="outline" size="sm" onClick={handleViewProject}>
          <ExternalLink className="w-4 h-4" />
          View Full Project
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/orders")}
        >
          <X className="w-4 h-4" />
          Close
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Complete order details, internal communications, and client contact
      </p>
    </div>
  );
}
