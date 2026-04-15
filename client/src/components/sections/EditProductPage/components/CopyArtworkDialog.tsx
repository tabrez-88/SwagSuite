import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CopyArtworkDialogProps {
  copyingArtworkId: string | null;
  onClose: () => void;
  currentItemId: string;
  orderItems: any[];
  copyArtworkMutation: { isPending: boolean; mutate: (args: any, opts?: any) => void };
}

export function CopyArtworkDialog({
  copyingArtworkId,
  onClose,
  currentItemId,
  orderItems,
  copyArtworkMutation,
}: CopyArtworkDialogProps) {
  const otherItems = orderItems.filter((i: any) => i.id !== currentItemId);

  return (
    <Dialog open={!!copyingArtworkId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Copy Artwork to Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Select a product to copy this artwork to:</p>
          {otherItems.map((i: any) => (
            <div key={i.id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{i.productName || "Unnamed"}</p>
                {i.productSku && <p className="text-[10px] text-gray-400">{i.productSku}</p>}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  disabled={copyArtworkMutation.isPending}
                  onClick={() => copyArtworkMutation.mutate(
                    { targetItemId: i.id, sourceArtworkId: copyingArtworkId!, includePricing: false },
                    { onSuccess: onClose }
                  )}
                >
                  Art Only
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={copyArtworkMutation.isPending}
                  onClick={() => copyArtworkMutation.mutate(
                    { targetItemId: i.id, sourceArtworkId: copyingArtworkId!, includePricing: true },
                    { onSuccess: onClose }
                  )}
                >
                  Art + Pricing
                </Button>
              </div>
            </div>
          ))}
          {otherItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No other products in this order</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
