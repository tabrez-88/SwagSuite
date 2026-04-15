import TierPricingPanel from "@/components/sections/TierPricingPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";

interface PricingTiersDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string | undefined;
  pricingTiers: any[];
  defaultMargin: number;
  totalQuantity: number;
  runChargeCostPerUnit: number;
  sizeSurcharges: any[];
  availableSizes: string[];
  onApplyTier: (cost: number, price: number) => void;
}

export function PricingTiersDialog({
  open,
  onClose,
  productName,
  pricingTiers,
  defaultMargin,
  totalQuantity,
  runChargeCostPerUnit,
  sizeSurcharges,
  availableSizes,
  onApplyTier,
}: PricingTiersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Supplier Pricing — {productName}
          </DialogTitle>
        </DialogHeader>
        <TierPricingPanel
          tiers={pricingTiers}
          defaultMargin={defaultMargin}
          totalQuantity={totalQuantity}
          runChargeCostPerUnit={runChargeCostPerUnit}
          sizeSurcharges={sizeSurcharges}
          availableSizes={availableSizes}
          onApplyTier={(cost, price) => {
            onApplyTier(cost, price);
            onClose();
          }}
        />
        <p className="text-[10px] text-gray-400 text-center">
          To edit pricing tiers, go to the product catalog page.
        </p>
      </DialogContent>
    </Dialog>
  );
}
