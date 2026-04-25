import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import { Copy, FileText } from "lucide-react";
import { useCallback } from "react";
import type { VendorPO } from "../../types";

export interface PoPreviewProps {
  open: boolean;
  onClose: () => void;
  vendorPO: VendorPO | null;
  order: Record<string, unknown> | null;
  projectId: string;
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
  getVendorDefaultAddress: (vendorId: string) => Record<string, unknown> | null;
}

export default function PoPreview({
  open, onClose, vendorPO, order, projectId,
  allArtworkItems, getVendorDefaultAddress,
}: PoPreviewProps) {
  const { toast } = useToast();

  const copyPOToClipboard = useCallback((po: VendorPO) => {
    const lns: string[] = [`PURCHASE ORDER`, `Order: ${(order?.orderNumber as string) || projectId}`, `Vendor: ${po.vendor.name}`];
    if (po.vendor.email) lns.push(`Email: ${po.vendor.email}`);
    lns.push(`Date: ${new Date().toLocaleDateString()}`, `${"─".repeat(50)}`);
    po.items.forEach((item) => {
      lns.push(`\n${item.productName || "Product"} (${item.productSku || "No SKU"})`);
      const itemLines = po.lines[item.id] || [];
      if (itemLines.length > 0) {
        itemLines.forEach((l) => {
          const qty = l.quantity || 0;
          const cost = parseFloat(l.cost || "0");
          lns.push(`  ${(l.color || "--").padEnd(11)}${(l.size || "--").padEnd(11)}${String(qty).padEnd(7)}$${cost.toFixed(2).padEnd(11)}$${(qty * cost).toFixed(2)}`);
        });
      } else {
        const qty = item.quantity || 0;
        const cost = parseFloat(item.cost || item.unitPrice || "0");
        lns.push(`  Qty: ${qty}  |  Cost: $${cost.toFixed(2)}  |  Total: $${(qty * cost).toFixed(2)}`);
      }
    });
    lns.push(`\n${"─".repeat(50)}`, `TOTAL: ${po.totalQty} units  |  $${po.totalCost.toFixed(2)}`);
    navigator.clipboard.writeText(lns.join("\n")).then(() => toast({ title: "PO copied to clipboard" }));
  }, [order, projectId, toast]);

  if (!vendorPO) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Purchase Order Preview
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-lg">PURCHASE ORDER</h3>
                <p className="text-sm text-gray-600">Order: {(order?.orderNumber as string) || projectId}</p>
                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{vendorPO.vendor.name}</p>
                {(() => {
                  const addr = getVendorDefaultAddress(vendorPO.vendor.id);
                  if (!addr) return null;
                  const line = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ");
                  return line ? <p className="text-sm text-gray-600">{line}</p> : null;
                })()}
                {vendorPO.vendor.email && <p className="text-sm text-gray-600">{vendorPO.vendor.email}</p>}
              </div>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">Product</th>
                  <th className="text-right p-3 font-semibold">Qty</th>
                  <th className="text-right p-3 font-semibold">Cost</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {vendorPO.items.map((item) => {
                  const qty = item.quantity || 0;
                  const cost = parseFloat(item.cost || item.unitPrice || "0");
                  const itemArts = allArtworkItems[item.id] || [];
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.productSku}</p>
                        {itemArts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {itemArts.map((art) => (
                              <div key={art.id as string} className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1">
                                {(art.filePath as string) ? (() => {
                                  const fp = art.filePath as string;
                                  const ext = fp.split("?")[0].split(".").pop()?.toLowerCase();
                                  const isDesign = ["ai", "eps", "psd"].includes(ext || "");
                                  const src = isDesign && fp.includes("cloudinary.com")
                                    ? getCloudinaryThumbnail(fp, 48, 48) : fp;
                                  return <img src={src} className="w-6 h-6 rounded object-contain border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                                })() : null}
                                <span className="font-medium">{String(art.name || "")}</span>
                                {(art.artworkType as string) ? <span>· {String(art.artworkType)}</span> : null}
                                {(art.location as string) ? <span>· {String(art.location)}</span> : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right align-top">{qty}</td>
                      <td className="p-3 text-right align-top">${cost.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium align-top">${(qty * cost).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="p-3 font-bold">TOTAL</td>
                  <td></td>
                  <td className="p-3 text-right font-bold text-blue-700">${vendorPO.totalCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => copyPOToClipboard(vendorPO)}>
            <Copy className="w-4 h-4 mr-2" /> Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
