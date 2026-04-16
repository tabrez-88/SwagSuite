import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Save } from "lucide-react";

interface ChargeFormState {
  description: string;
  chargeType: string;
  chargeCategory: "run" | "fixed";
  amount: number;
  netCost: number;
  retailPrice: number;
  margin: number;
  quantity: number;
  isVendorCharge: boolean;
  displayToClient: boolean;
  displayToVendor: boolean;
  includeInUnitPrice: boolean;
}

interface AddEditChargeDialogProps {
  open: boolean;
  editingCharge: any | null;
  newCharge: ChargeFormState;
  setNewCharge: (updater: (prev: ChargeFormState) => ChargeFormState) => void;
  itemId: string;
  addChargeMutation: { isPending: boolean; mutate: (args: any, opts?: any) => void };
  updateChargeMutation: { isPending: boolean; mutate: (args: any, opts?: any) => void };
  onClose: () => void;
}

const EMPTY_CHARGE: ChargeFormState = {
  description: "",
  chargeType: "flat",
  chargeCategory: "fixed",
  amount: 0,
  netCost: 0,
  retailPrice: 0,
  margin: 0,
  quantity: 1,
  isVendorCharge: false,
  displayToClient: true,
  displayToVendor: true,
  includeInUnitPrice: false,
};

export function AddEditChargeDialog({
  open,
  editingCharge,
  newCharge,
  setNewCharge,
  itemId,
  addChargeMutation,
  updateChargeMutation,
  onClose,
}: AddEditChargeDialogProps) {
  const isBusy = addChargeMutation.isPending || updateChargeMutation.isPending;

  const handleSubmit = () => {
    const chargeData = {
      description: newCharge.description,
      chargeType: newCharge.chargeType,
      chargeCategory: newCharge.chargeCategory,
      amount: (newCharge.retailPrice || newCharge.amount).toFixed(2),
      netCost: newCharge.netCost.toFixed(4),
      retailPrice: (newCharge.retailPrice || newCharge.amount).toFixed(2),
      margin: newCharge.margin.toFixed(2),
      quantity: newCharge.chargeCategory === "fixed" ? newCharge.quantity : 1,
      isVendorCharge: newCharge.isVendorCharge,
      displayToClient: newCharge.includeInUnitPrice ? false : newCharge.displayToClient,
      displayToVendor: newCharge.displayToVendor !== false,
      includeInUnitPrice: newCharge.includeInUnitPrice,
    };
    const onSuccess = () => {
      onClose();
      setNewCharge(() => EMPTY_CHARGE);
    };
    if (editingCharge) {
      updateChargeMutation.mutate(
        { orderItemId: editingCharge.orderItemId, chargeId: editingCharge.id, updates: chargeData },
        { onSuccess }
      );
    } else {
      addChargeMutation.mutate({ orderItemId: itemId, charge: chargeData }, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCharge ? "Edit Charge" : "Add Charge"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Charge Category Toggle */}
          <div>
            <Label className="mb-1.5 block">Charge Category</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={newCharge.chargeCategory === "run" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setNewCharge(c => ({ ...c, chargeCategory: "run" as const }))}
              >
                Run Charge (per unit)
              </Button>
              <Button
                type="button"
                variant={newCharge.chargeCategory === "fixed" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setNewCharge(c => ({ ...c, chargeCategory: "fixed" as const }))}
              >
                Fixed Charge (one-time)
              </Button>
            </div>
          </div>
          <div>
            <Label>Description *</Label>
            <Input
              value={newCharge.description}
              onChange={(e) => setNewCharge(c => ({ ...c, description: e.target.value }))}
              placeholder={newCharge.chargeCategory === "run" ? "e.g., Setup Fee per unit, Imprint Charge" : "e.g., Screen Setup, PMS Color Match"}
            />
          </div>
          {newCharge.chargeCategory === "fixed" && (
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={newCharge.quantity}
                onChange={(e) => setNewCharge(c => ({ ...c, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Net Cost *</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={newCharge.netCost || ""}
                placeholder="0.00"
                onChange={(e) => {
                  const cost = parseFloat(e.target.value) || 0;
                  setNewCharge(c => {
                    const m = c.margin || 0;
                    const retail = m > 0 && m < 100 ? parseFloat((cost / (1 - m / 100)).toFixed(2)) : cost;
                    return { ...c, netCost: cost, retailPrice: retail, amount: retail };
                  });
                }}
              />
            </div>
            <div>
              <Label>Margin %</Label>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={99.99}
                value={newCharge.margin || ""}
                placeholder="0"
                onChange={(e) => {
                  const m = parseFloat(e.target.value) || 0;
                  setNewCharge(c => {
                    const cost = c.netCost || 0;
                    const retail = cost > 0 && m > 0 && m < 100 ? parseFloat((cost / (1 - m / 100)).toFixed(2)) : cost;
                    return { ...c, margin: m, retailPrice: retail, amount: retail };
                  });
                }}
              />
            </div>
            <div>
              <Label>Retail Price *</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={newCharge.retailPrice || ""}
                placeholder="0.00"
                onChange={(e) => {
                  const retail = parseFloat(e.target.value) || 0;
                  setNewCharge(c => {
                    const cost = c.netCost || 0;
                    const m = retail > 0 && cost > 0 ? parseFloat(((retail - cost) / retail * 100).toFixed(2)) : 0;
                    return { ...c, retailPrice: retail, margin: m, amount: retail };
                  });
                }}
              />
            </div>
          </div>
          {newCharge.netCost > 0 && newCharge.retailPrice > 0 && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5 flex justify-between">
              <span>Profit: <strong>
                ${(newCharge.retailPrice - newCharge.netCost).toFixed(2)}
              </strong></span>
              <span>Margin: <strong>
                {newCharge.margin.toFixed(1)}%
              </strong></span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ep-vendor-charge" checked={newCharge.isVendorCharge} onChange={(e) => setNewCharge(c => ({ ...c, isVendorCharge: e.target.checked }))} className="rounded border-gray-300" />
            <Label htmlFor="ep-vendor-charge" className="font-normal text-sm">This is a vendor charge (cost, not revenue)</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ep-include-price" checked={newCharge.includeInUnitPrice} onChange={(e) => setNewCharge(c => ({ ...c, includeInUnitPrice: e.target.checked }))} className="rounded border-gray-300" />
            <Label htmlFor="ep-include-price" className="font-normal text-sm">
              {newCharge.chargeCategory === "run" ? "Include in unit price" : "Subtract from margin"}
            </Label>
          </div>
          {!newCharge.includeInUnitPrice && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ep-display-client" checked={newCharge.displayToClient} onChange={(e) => setNewCharge(c => ({ ...c, displayToClient: e.target.checked }))} className="rounded border-gray-300" />
              <Label htmlFor="ep-display-client" className="font-normal text-sm">Display to client</Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ep-display-vendor" checked={newCharge.displayToVendor !== false} onChange={(e) => setNewCharge(c => ({ ...c, displayToVendor: e.target.checked }))} className="rounded border-gray-300" />
            <Label htmlFor="ep-display-vendor" className="font-normal text-sm">Show on vendor PO</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!newCharge.description || (newCharge.retailPrice <= 0 && newCharge.amount <= 0) || isBusy}
            onClick={handleSubmit}
          >
            {isBusy
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : editingCharge ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />
            }
            {editingCharge ? "Save Changes" : "Add Charge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
