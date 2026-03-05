import { useState, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ClipboardList, Package, Building2, ChevronDown, ChevronRight,
  FileText, Printer, Copy, Loader2, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectData } from "@/types/project-types";
import type { OrderItemLine } from "@shared/schema";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import PurchaseOrderTemplate from "@/components/documents/PurchaseOrderTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/DocumentEditor";

interface PurchaseOrdersSectionProps {
  orderId: string;
  data: ProjectData;
}

interface VendorPO {
  vendor: any;
  items: any[];
  lines: Record<string, OrderItemLine[]>;
  totalQty: number;
  totalCost: number;
}

function getEditedItem(_id: string, item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    supplierId: item.supplierId,
    color: item.color || "",
    quantity: item.quantity || 0,
    unitPrice: parseFloat(item.unitPrice) || 0,
    cost: parseFloat(item.cost || 0),
    decorationCost: parseFloat(item.decorationCost || 0),
    charges: parseFloat(item.charges || 0),
    margin: 44,
    sizePricing: item.sizePricing || {},
  };
}

export default function PurchaseOrdersSection({ orderId, data }: PurchaseOrdersSectionProps) {
  const { order, orderVendors, orderItems, allItemLines, allItemCharges } = data;
  const { toast } = useToast();
  const poRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [previewPO, setPreviewPO] = useState<VendorPO | null>(null);
  const [generatingVendorId, setGeneratingVendorId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  const {
    poDocuments,
    isGenerating,
    generateDocument,
    deleteDocument,
    isDeleting,
  } = useDocumentGeneration(orderId);

  const toggleVendor = useCallback((vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId); else next.add(vendorId);
      return next;
    });
  }, []);

  // Build PO data per vendor
  const vendorPOs: VendorPO[] = useMemo(() => {
    return orderVendors.map((vendor: any) => {
      const items = orderItems.filter((item: any) => item.supplierId === vendor.id);
      const lines: Record<string, OrderItemLine[]> = {};
      let totalQty = 0;
      let totalCost = 0;

      items.forEach((item: any) => {
        const itemLines = allItemLines[item.id] || [];
        lines[item.id] = itemLines;

        if (itemLines.length > 0) {
          itemLines.forEach((l) => {
            const qty = l.quantity || 0;
            const cost = parseFloat(l.cost || "0");
            totalQty += qty;
            totalCost += qty * cost;
          });
        } else {
          const qty = item.quantity || 0;
          const cost = parseFloat(item.cost || item.unitPrice || "0");
          totalQty += qty;
          totalCost += qty * cost;
        }
      });

      return { vendor, items, lines, totalQty, totalCost };
    });
  }, [orderVendors, orderItems, allItemLines]);

  const grandTotalCost = vendorPOs.reduce((s, po) => s + po.totalCost, 0);
  const grandTotalQty = vendorPOs.reduce((s, po) => s + po.totalQty, 0);

  // Vendor PO hashes for stale detection
  const vendorHashes = useMemo(() => {
    const hashes: Record<string, string> = {};
    for (const vendor of orderVendors) {
      const vendorItems = orderItems.filter((i: any) => i.supplierId === vendor.id);
      hashes[vendor.id] = buildItemsHash(vendorItems, "po", order);
    }
    return hashes;
  }, [orderVendors, orderItems, order]);

  const getVendorDoc = (vendorId: string) => {
    return poDocuments.find((d: any) => d.vendorId === vendorId);
  };

  const isVendorDocStale = (doc: any) => {
    if (!doc?.metadata?.itemsHash || !doc.vendorId) return false;
    return doc.metadata.itemsHash !== vendorHashes[doc.vendorId];
  };

  const handleGeneratePO = async (vendorId: string, vendorName: string) => {
    const ref = poRefs.current[vendorId];
    if (!ref) return;

    const poNumber = `${(order as any)?.orderNumber || orderId}-${vendorId.substring(0, 4).toUpperCase()}`;
    setGeneratingVendorId(vendorId);

    try {
      await generateDocument({
        elementRef: ref,
        documentType: "purchase_order",
        documentNumber: poNumber,
        vendorId,
        vendorName,
        itemsHash: vendorHashes[vendorId],
      });
      toast({ title: `PO PDF generated for ${vendorName}` });
    } catch {
      // Error handled by hook
    } finally {
      setGeneratingVendorId(null);
    }
  };

  const handleRegeneratePO = async (doc: any) => {
    await deleteDocument(doc.id);
    await new Promise((r) => setTimeout(r, 300));
    await handleGeneratePO(doc.vendorId, doc.vendorName);
  };

  // Copy PO text to clipboard
  const copyPOToClipboard = useCallback((po: VendorPO) => {
    const lines: string[] = [];
    lines.push(`PURCHASE ORDER`);
    lines.push(`Order: ${(order as any)?.orderNumber || orderId}`);
    lines.push(`Vendor: ${po.vendor.name}`);
    if (po.vendor.email) lines.push(`Email: ${po.vendor.email}`);
    if (po.vendor.contactPerson) lines.push(`Attn: ${po.vendor.contactPerson}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`${"─".repeat(50)}`);

    po.items.forEach((item: any) => {
      lines.push(`\n${item.productName || "Product"} (${item.productSku || "No SKU"})`);
      const itemLines = po.lines[item.id] || [];
      if (itemLines.length > 0) {
        lines.push(`  Color       Size       Qty    Cost       Total`);
        itemLines.forEach((l) => {
          const qty = l.quantity || 0;
          const cost = parseFloat(l.cost || "0");
          lines.push(`  ${(l.color || "--").padEnd(11)}${(l.size || "--").padEnd(11)}${String(qty).padEnd(7)}$${cost.toFixed(2).padEnd(11)}$${(qty * cost).toFixed(2)}`);
        });
      } else {
        const qty = item.quantity || 0;
        const cost = parseFloat(item.cost || item.unitPrice || "0");
        lines.push(`  Qty: ${qty}  |  Cost: $${cost.toFixed(2)}  |  Total: $${(qty * cost).toFixed(2)}`);
      }
    });

    lines.push(`\n${"─".repeat(50)}`);
    lines.push(`TOTAL: ${po.totalQty} units  |  $${po.totalCost.toFixed(2)}`);

    if ((order as any)?.inHandsDate) {
      lines.push(`In-Hands Date: ${new Date((order as any).inHandsDate).toLocaleDateString()}`);
    }
    if ((order as any)?.supplierNotes) {
      lines.push(`\nNotes: ${(order as any).supplierNotes}`);
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast({ title: "PO copied to clipboard" });
    });
  }, [order, orderId, toast]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Purchase Orders
          </h2>
          <Badge variant="secondary" className="text-xs">
            {vendorPOs.length} vendor{vendorPOs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Empty state */}
      {vendorPOs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No vendors on this order</p>
            <p className="text-xs text-gray-400">Add products with vendor/supplier info to generate POs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vendorPOs.map((po) => {
            const isExpanded = expandedVendors.has(po.vendor.id);
            const vendorDoc = getVendorDoc(po.vendor.id);
            const isVendorGenerating = generatingVendorId === po.vendor.id;

            return (
              <Card key={po.vendor.id} className="overflow-hidden">
                {/* Vendor header row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleVendor(po.vendor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-sm">{po.vendor.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {po.vendor.contactPerson && <span>Attn: {po.vendor.contactPerson}</span>}
                          {po.vendor.email && <span>{po.vendor.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Items</p>
                        <p className="font-semibold">{po.items.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Qty</p>
                        <p className="font-semibold">{po.totalQty}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Cost</p>
                        <p className="font-semibold text-blue-600">${po.totalCost.toFixed(2)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!vendorDoc && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleGeneratePO(po.vendor.id, po.vendor.name)}
                            disabled={isVendorGenerating || isGenerating}
                          >
                            {isVendorGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            Generate PDF
                          </Button>
                        )}
                        {vendorDoc && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              if (vendorDoc.fileUrl) {
                                const link = document.createElement("a");
                                link.href = vendorDoc.fileUrl;
                                link.download = vendorDoc.fileName || `po-${vendorDoc.documentNumber}.pdf`;
                                link.target = "_blank";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" /> PDF
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPreviewPO(po)}>
                          <FileText className="w-3 h-3 mr-1" /> Preview
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyPOToClipboard(po)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy PO
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded — item list with lines */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    {po.items.map((item: any, idx: number) => {
                      const itemLines = po.lines[item.id] || [];
                      return (
                        <div key={item.id} className={`px-6 py-3 ${idx < po.items.length - 1 ? "border-b" : ""}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{item.productName || "Product"}</span>
                              <span className="text-xs text-blue-600">{item.productSku || ""}</span>
                            </div>
                          </div>

                          {itemLines.length > 0 ? (
                            <div className="border rounded bg-white overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Color</th>
                                    <th className="text-left p-2 font-medium">Size</th>
                                    <th className="text-right p-2 font-medium">Qty</th>
                                    <th className="text-right p-2 font-medium">Cost</th>
                                    <th className="text-right p-2 font-medium">Ext. Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {itemLines.map((l) => {
                                    const qty = l.quantity || 0;
                                    const cost = parseFloat(l.cost || "0");
                                    return (
                                      <tr key={l.id} className="border-b last:border-0">
                                        <td className="p-2">{l.color || "--"}</td>
                                        <td className="p-2">{l.size || "--"}</td>
                                        <td className="p-2 text-right font-medium">{qty}</td>
                                        <td className="p-2 text-right">${cost.toFixed(2)}</td>
                                        <td className="p-2 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 flex gap-4 ml-6">
                              <span>Qty: <strong>{item.quantity}</strong></span>
                              <span>Cost: <strong>${parseFloat(item.cost || item.unitPrice || "0").toFixed(2)}</strong></span>
                              {item.color && <span>Color: {item.color}</span>}
                              {item.size && <span>Size: {item.size}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Generated PO Documents */}
          {poDocuments.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generated PO Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {poDocuments.map((doc: any) => (
                  <GeneratedDocumentCard
                    key={doc.id}
                    document={doc}
                    isStale={isVendorDocStale(doc)}
                    onPreview={() => setPreviewDocument(doc)}
                    onDelete={() => deleteDocument(doc.id)}
                    onRegenerate={() => handleRegeneratePO(doc)}
                    isDeleting={isDeleting}
                    isRegenerating={isGenerating}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Grand totals */}
          <Card className="bg-purple-50/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-gray-500 text-xs">Vendors</span>
                    <p className="font-semibold">{vendorPOs.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{grandTotalQty}</p>
                  </div>
                  {(order as any)?.inHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">In-Hands Date</span>
                      <p className="font-semibold">{new Date((order as any).inHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total PO Cost</span>
                  <p className="text-lg font-bold text-purple-700">${grandTotalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden PO templates for PDF generation */}
      {vendorPOs.map((po) => {
        const poNumber = `${(order as any)?.orderNumber || orderId}-${po.vendor.id.substring(0, 4).toUpperCase()}`;
        return (
          <PurchaseOrderTemplate
            key={po.vendor.id}
            ref={(el) => { poRefs.current[po.vendor.id] = el; }}
            order={order}
            vendor={po.vendor}
            vendorItems={po.items}
            poNumber={poNumber}
          />
        );
      })}

      {/* PO PREVIEW DIALOG */}
      <Dialog open={!!previewPO} onOpenChange={(open) => !open && setPreviewPO(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Purchase Order Preview
            </DialogTitle>
          </DialogHeader>

          {previewPO && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">PURCHASE ORDER</h3>
                    <p className="text-sm text-gray-600">Order: {(order as any)?.orderNumber || orderId}</p>
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    {(order as any)?.inHandsDate && (
                      <p className="text-sm text-orange-600 font-medium">
                        In-Hands: {new Date((order as any).inHandsDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{previewPO.vendor.name}</p>
                    {previewPO.vendor.contactPerson && <p className="text-sm">{previewPO.vendor.contactPerson}</p>}
                    {previewPO.vendor.email && <p className="text-sm text-gray-600">{previewPO.vendor.email}</p>}
                    {previewPO.vendor.phone && <p className="text-sm text-gray-600">{previewPO.vendor.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold">Product</th>
                      <th className="text-left p-3 font-semibold">Color</th>
                      <th className="text-left p-3 font-semibold">Size</th>
                      <th className="text-right p-3 font-semibold">Qty</th>
                      <th className="text-right p-3 font-semibold">Cost</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPO.items.map((item: any) => {
                      const itemLines = previewPO.lines[item.id] || [];
                      if (itemLines.length > 0) {
                        return itemLines.map((l, i) => {
                          const qty = l.quantity || 0;
                          const cost = parseFloat(l.cost || "0");
                          return (
                            <tr key={l.id} className="border-b">
                              {i === 0 && (
                                <td className="p-3" rowSpan={itemLines.length}>
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-xs text-gray-500">{item.productSku}</p>
                                </td>
                              )}
                              <td className="p-3 text-xs">{l.color || "--"}</td>
                              <td className="p-3 text-xs">{l.size || "--"}</td>
                              <td className="p-3 text-right">{qty}</td>
                              <td className="p-3 text-right">${cost.toFixed(2)}</td>
                              <td className="p-3 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                            </tr>
                          );
                        });
                      }
                      const qty = item.quantity || 0;
                      const cost = parseFloat(item.cost || item.unitPrice || "0");
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.productSku}</p>
                          </td>
                          <td className="p-3 text-xs">{item.color || "--"}</td>
                          <td className="p-3 text-xs">{item.size || "--"}</td>
                          <td className="p-3 text-right">{qty}</td>
                          <td className="p-3 text-right">${cost.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={3} className="p-3 font-bold">TOTAL</td>
                      <td className="p-3 text-right font-bold">{previewPO.totalQty}</td>
                      <td></td>
                      <td className="p-3 text-right font-bold text-blue-700">${previewPO.totalCost.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {(order as any)?.supplierNotes && (
                <div className="border rounded-lg p-3 bg-yellow-50">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Notes to Vendor</p>
                  <p className="text-sm">{(order as any).supplierNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPO(null)}>Close</Button>
            <Button variant="outline" onClick={() => { previewPO && copyPOToClipboard(previewPO); }}>
              <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Editor Modal */}
      {previewDocument && (
        <DocumentEditor
          document={previewDocument}
          order={order}
          orderItems={orderItems}
          companyName={(data as any).companyName || ""}
          primaryContact={(data as any).primaryContact}
          getEditedItem={getEditedItem}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
