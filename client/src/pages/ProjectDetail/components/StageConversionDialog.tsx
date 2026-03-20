import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { getStageTransitionPayload } from "@/constants/businessStages";
import { useToast } from "@/hooks/use-toast";

interface StageConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStage: "quote" | "sales_order";
  orderId: string;
  enrichedItems: any[];
  onSuccess: () => void;
}

interface ItemSelection {
  selected: boolean;
  quantity: number;
}

export default function StageConversionDialog({
  open,
  onOpenChange,
  targetStage,
  orderId,
  enrichedItems,
  onSuccess,
}: StageConversionDialogProps) {
  const { toast } = useToast();
  const targetLabel = targetStage === "quote" ? "Quote" : "Sales Order";

  const [selections, setSelections] = useState<Record<string, ItemSelection>>(() => {
    const initial: Record<string, ItemSelection> = {};
    enrichedItems.forEach((item) => {
      initial[item.id] = {
        selected: (item.quantity || 0) > 0,
        quantity: item.quantity || 0,
      };
    });
    return initial;
  });

  const selectedCount = Object.values(selections).filter((s) => s.selected).length;

  const convertMutation = useMutation({
    mutationFn: async () => {
      // Update quantities for changed/deselected items first
      const updatePromises = Object.entries(selections).map(async ([itemId, sel]) => {
        const originalItem = enrichedItems.find((i: any) => i.id === itemId);
        if (!originalItem) return;

        if (!sel.selected) {
          await apiRequest("PATCH", `/api/orders/${orderId}/items/${itemId}`, { quantity: 0 });
        } else if (sel.quantity !== originalItem.quantity) {
          await apiRequest("PATCH", `/api/orders/${orderId}/items/${itemId}`, { quantity: sel.quantity });
        }
      });
      await Promise.all(updatePromises);

      // Then update order status to transition to the target stage
      const payload = getStageTransitionPayload(targetStage);
      // Auto-set presentation as converted when moving to quote or sales order
      if (targetStage === "quote" || targetStage === "sales_order") {
        (payload as any).presentationStatus = "converted";
      }
      await apiRequest("PATCH", `/api/orders/${orderId}`, payload);
    },
    onSuccess: () => {
      toast({
        title: `Converted to ${targetLabel}`,
        description: `${selectedCount} product(s) included in the ${targetLabel.toLowerCase()}.`,
      });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Conversion failed", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Convert to {targetLabel}
          </DialogTitle>
          <DialogDescription>
            Select which products to include and confirm quantities.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {enrichedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No products in this project yet.</p>
            </div>
          ) : (
            enrichedItems.map((item: any) => {
              const sel = selections[item.id];
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                    sel?.selected ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"
                  )}
                >
                  <Checkbox
                    checked={sel?.selected ?? false}
                    onCheckedChange={(checked) => {
                      setSelections((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], selected: !!checked },
                      }));
                    }}
                  />

                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName || "Unnamed Product"}</p>
                    {item.productSku && (
                      <p className="text-xs text-gray-400">{item.productSku}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Qty:</label>
                    <Input
                      type="number"
                      min={0}
                      className="w-20 h-8 text-sm"
                      value={sel?.quantity ?? 0}
                      disabled={!sel?.selected}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        setSelections((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], quantity: qty },
                        }));
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-500">{selectedCount} of {enrichedItems.length} products selected</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending || selectedCount === 0}
              className={targetStage === "quote" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Convert to {targetLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
