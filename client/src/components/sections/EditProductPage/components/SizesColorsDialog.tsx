import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function SizesColorsDialog({ open, onClose, colors, sizes, onDone }: {
  open: boolean;
  onClose: () => void;
  colors: string[];
  sizes: string[];
  onDone: (entries: { color: string; size: string; quantity: number }[]) => void;
}) {
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const effectiveSizes = sizes.length > 0 ? sizes : [""];
  const [sizeQtys, setSizeQtys] = useState<Record<string, number>>(
    Object.fromEntries(effectiveSizes.map(s => [s, 0]))
  );

  const handleDone = () => {
    const entries = Object.entries(sizeQtys)
      .filter(([, qty]) => qty > 0)
      .map(([size, quantity]) => ({ color: selectedColor, size, quantity }));
    if (entries.length > 0) onDone(entries);
  };

  const totalQty = Object.values(sizeQtys).reduce((s, q) => s + q, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Sizes & Colors</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 min-h-[250px]">
          {colors.length > 0 && (
            <div className="w-1/2 border-r pr-4">
              <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase">Color</Label>
              <div className="max-h-[280px] overflow-y-auto space-y-0.5">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                      selectedColor === c ? "bg-blue-100 text-blue-700 font-medium ring-1 ring-blue-300" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={colors.length > 0 ? "w-1/2" : "w-full"}>
            <div className="flex justify-between mb-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Size</Label>
              <Label className="text-xs font-semibold text-gray-500 uppercase">Quantity</Label>
            </div>
            <div className="space-y-2">
              {effectiveSizes.map(s => (
                <div key={s || "default"} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{s || "Default"}</span>
                  <Input
                    type="number"
                    min={0}
                    className="w-20 h-8 text-sm text-center"
                    value={sizeQtys[s] || 0}
                    onChange={(e) => setSizeQtys(prev => ({ ...prev, [s]: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            {totalQty > 0 && (
              <div className="mt-3 pt-2 border-t text-xs text-gray-500 text-right">
                Total: <strong className="text-gray-800">{totalQty} units</strong>
                {selectedColor && <span className="ml-2">in {selectedColor}</span>}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={totalQty === 0} onClick={handleDone}>
            Add {totalQty > 0 ? `${totalQty} Items` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
