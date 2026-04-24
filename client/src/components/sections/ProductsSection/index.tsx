import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "react-beautiful-dnd";
import { createPortal } from "react-dom";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImprintOptionSelect } from "@/components/shared/ImprintOptionSelect";
import { isBelowMinimum } from "@/hooks/useMarginSettings";
import {
  AlertTriangle,
  Edit2,
  GripVertical,
  Loader2,
  Package,
  Palette,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useProductsSection } from "./hooks";
import OrderItemCard from "./OrderItems.tsx";
import type { ProductsSectionProps } from "./types";
import { Separator } from "@/components/ui/separator";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal.tsx";
import ServiceChargesPanel from "@/pages/Projects/ProjectDetail/sections/SalesOrderSection/ServiceChargesPanel";
import { useCallback, useRef } from "react";

/** Portal dragged row to document.body so Radix Dialog transform doesn't offset it */
function PortalAwareDrag({ provided, snapshot, children }: {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  children: React.ReactNode;
}) {
  const el = (
    <tr ref={provided.innerRef} {...provided.draggableProps}
      className={snapshot.isDragging ? "bg-white shadow-lg border rounded opacity-90" : "border-b last:border-0"}
      style={provided.draggableProps.style}
    >
      {children}
    </tr>
  );
  return snapshot.isDragging ? createPortal(el, document.body) : el;
}

export default function ProductsSection({ projectId, data, isLocked }: ProductsSectionProps) {
  const productSection = useProductsSection({ projectId, data, isLocked });
  const addServiceRef = useRef<(() => void) | null>(null);
  const onRegisterAdd = useCallback((fn: () => void) => { addServiceRef.current = fn; }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = [...productSection.orderItems];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // Optimistic: mutate sends new order to backend
    productSection.reorderItemsMutation.mutate(items.map((i: any) => i.id));
  };

  return (
    <>
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {productSection.orderItems.length} {productSection.orderItems.length === 1 ? "item" : "items"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => addServiceRef.current?.()} disabled={productSection.isLocked}>
              <Plus className="w-4 h-4" />
              Service
            </Button>
            <Button size="sm" onClick={() => productSection.setLocation(productSection.addProductPath)} disabled={productSection.isLocked}>
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
      {/* Empty State */}
      {productSection.orderItems.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products in this order yet</h3>
          <p className="text-sm text-gray-500 mb-4">Click "Add Product" to add items from your catalog</p>
          <Button variant="outline" onClick={() => productSection.setLocation(productSection.addProductPath)} disabled={productSection.isLocked}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="order-items">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {productSection.orderItems.map((item: any, index: number) => (
                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isLocked}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={snapshot.isDragging ? "opacity-90 shadow-lg rounded-lg" : ""}
                        >
                          <div className="flex items-start gap-1">
                            {!isLocked && (
                              <div
                                {...dragProvided.dragHandleProps}
                                className="mt-3 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                            )}
                            <div className="flex-1">
                              <OrderItemCard item={item} productSection={productSection} />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {/* SERVICE CHARGES (embedded) */}
          <ServiceChargesPanel
            projectId={projectId}
            isLocked={!!isLocked}
            embedded
            onRegisterAdd={onRegisterAdd}
          />
          <Separator className="my-4" />
          {/* ORDER SUMMARY */}
          <Card className="bg-gray-200 rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Left: item counts + cost */}
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="uppercase text-[10px] text-gray-500">Items</span>
                    <p className="font-semibold">{productSection.orderItems.length}</p>
                  </div>
                  <div>
                    <span className="uppercase text-[10px] text-gray-500">Total Qty</span>
                    <p className="font-semibold">{productSection.orderTotals.totalQty}</p>
                  </div>
                  <div>
                    <span className="uppercase text-[10px] text-gray-500">Total Cost</span>
                    <p className="font-semibold">${productSection.orderTotals.totalCost.toFixed(2)}</p>
                  </div>
                  {productSection.orderTotals.totalCharges > 0 && (
                    <div>
                      <span className="uppercase text-[10px] text-gray-500">Charges</span>
                      <p className="font-semibold">${productSection.orderTotals.totalCharges.toFixed(2)}</p>
                    </div>
                  )}
                  <div title={`Min: ${productSection.marginSettings.minimumMargin}% | Target: ${productSection.marginSettings.defaultMargin}%`}>
                    <span className="uppercase text-[10px] text-gray-500">Margin</span>
                    <p className={`font-bold flex items-center gap-1 ${productSection.marginColor(productSection.margin)}`}>
                      <TrendingUp className="w-4 h-4" />
                      {productSection.margin.toFixed(1)}%
                      {isBelowMinimum(productSection.margin, productSection.marginSettings) && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </p>
                  </div>
                </div>
                {/* Right: Subtotal / Tax / Total */}
                {(() => {
                  const order = data?.order;
                  const subtotal = parseFloat(order?.subtotal || "0");
                  const tax = parseFloat(order?.tax || "0");
                  const taxRate = parseFloat(order?.taxRate || "0");
                  const total = parseFloat(order?.total || "0");
                  return (
                    <div className="text-sm text-right space-y-0.5 min-w-[180px]">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{tax > 0 && taxRate > 0 ? `Tax (${taxRate}%)` : "Tax"}</span>
                        <span className="font-medium">{tax > 0 ? `$${tax.toFixed(2)}` : "Exempt"}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-400 pt-1 mt-1">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {isBelowMinimum(productSection.margin, productSection.marginSettings) && (
                <div className="mt-2 pt-2 border-t border-red-200 flex items-center justify-end gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Overall order margin ({productSection.margin.toFixed(1)}%) is below the company minimum of {productSection.marginSettings.minimumMargin}% — target is {productSection.marginSettings.defaultMargin}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </CardContent>
    </Card>

      {/* ADD CHARGE DIALOG */}
      <Dialog open={!!productSection.addChargeForItem} onOpenChange={(open) => !open && productSection.setAddChargeForItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Additional Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description *</Label>
              <Input
                value={productSection.newCharge.description}
                onChange={(e) => productSection.setNewCharge(c => ({ ...c, description: e.target.value }))}
                placeholder="e.g., Setup Fee, Rush Charge"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={productSection.newCharge.chargeType} onValueChange={(v) => productSection.setNewCharge(c => ({ ...c, chargeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Fee</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={productSection.newCharge.amount}
                  onChange={(e) => productSection.setNewCharge(c => ({ ...c, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vendor-charge"
                checked={productSection.newCharge.isVendorCharge}
                onChange={(e) => productSection.setNewCharge(c => ({ ...c, isVendorCharge: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="vendor-charge" className="font-normal text-sm">This is a vendor charge (cost, not revenue)</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="display-to-client"
                checked={productSection.newCharge.displayToClient}
                onChange={(e) => productSection.setNewCharge(c => ({ ...c, displayToClient: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="display-to-client" className="font-normal text-sm">Display to client (visible in presentation)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => productSection.setAddChargeForItem(null)}>Cancel</Button>
            <Button
              disabled={!productSection.newCharge.description || productSection.newCharge.amount <= 0 || productSection.addChargeMutation.isPending}
              onClick={() => {
                if (!productSection.addChargeForItem) return;
                productSection.addChargeMutation.mutate({
                  orderItemId: productSection.addChargeForItem,
                  charge: {
                    description: productSection.newCharge.description,
                    chargeType: productSection.newCharge.chargeType,
                    amount: productSection.newCharge.amount.toFixed(2),
                    isVendorCharge: productSection.newCharge.isVendorCharge,
                    displayToClient: productSection.newCharge.displayToClient,
                  },
                }, {
                  onSuccess: () => {
                    productSection.setAddChargeForItem(null);
                    productSection.setNewCharge({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false, displayToClient: true });
                  },
                });
              }}
            >
              {productSection.addChargeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ITEM DIALOG */}
      <AlertDialog open={productSection.isDeleteDialogOpen} onOpenChange={productSection.setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Remove Item from Order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{productSection.deletingProduct?.productName}</strong> from this order?
              {productSection.deletingProduct?.productSku && (
                <span className="block mt-1 text-xs text-gray-500">SKU: {productSection.deletingProduct.productSku}</span>
              )}
              <span className="block mt-2 text-orange-600 font-medium">
                This will remove the item and all its line items, charges, and artwork from this order.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { productSection.setDeletingProduct(null); productSection.setIsDeleteDialogOpen(false); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productSection.deletingProduct && productSection.deleteOrderItemMutation.mutate(productSection.deletingProduct.id, {
                onSuccess: () => { productSection.setIsDeleteDialogOpen(false); productSection.setDeletingProduct(null); },
                onError: () => productSection.setIsDeleteDialogOpen(false),
              })}
              className="bg-red-600 hover:bg-red-700"
              disabled={productSection.deleteOrderItemMutation.isPending}
            >
              {productSection.deleteOrderItemMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Remove Item</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT ITEM DIALOG */}
      <Dialog open={!!productSection.editingItem} onOpenChange={(open) => !open && productSection.setEditingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Edit Product
            </DialogTitle>
          </DialogHeader>
          {productSection.editingItem && (
            <div className="space-y-5">
              {/* Product Info Header */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const img = productSection.getProductImage(productSection.editingItem);
                  return img ? (
                    <img src={img} alt={productSection.editingItem.productName ?? undefined} className="w-16 h-16 object-contain rounded border bg-white" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{productSection.editingItem.productName || "Unnamed Product"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {productSection.editingItem.productSku && (
                      <Badge variant="outline" className="text-xs">{productSection.editingItem.productSku}</Badge>
                    )}
                    {productSection.getItemSupplier(productSection.editingItem) && (
                      <span className="text-sm text-gray-500">{productSection.getItemSupplier(productSection.editingItem)?.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Imprint Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Imprint Method</Label>
                  <ImprintOptionSelect
                    type="method"
                    value={productSection.editItemData.imprintMethod}
                    onChange={(v) => productSection.setEditItemData((d: any) => ({ ...d, imprintMethod: v }))}
                    orderId={productSection.projectId}
                  />
                </div>
                <div>
                  <Label>Imprint Location</Label>
                  <ImprintOptionSelect
                    type="location"
                    value={productSection.editItemData.imprintLocation}
                    onChange={(v) => productSection.setEditItemData((d: any) => ({ ...d, imprintLocation: v }))}
                    orderId={productSection.projectId}
                  />
                </div>
              </div>

              {/* Size/Color Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Size & Color Breakdown</Label>
                  <Button variant="outline" size="sm" onClick={productSection.addEditDialogLine}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="w-8"></th>
                        <th className="text-left p-3 font-medium">Color</th>
                        <th className="text-left p-3 font-medium">Size</th>
                        <th className="text-right p-3 font-medium w-20">Qty</th>
                        <th className="text-right p-3 font-medium w-28">Unit Cost</th>
                        <th className="text-right p-3 font-medium w-28">Unit Price</th>
                        <th className="text-right p-3 font-medium w-20">Margin</th>
                        <th className="text-right p-3 font-medium w-28">Line Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <DragDropContext onDragEnd={(result: DropResult) => {
                      if (!result.destination || result.destination.index === result.source.index) return;
                      productSection.reorderEditDialogLines(result.source.index, result.destination.index);
                    }}>
                      <Droppable droppableId="edit-dialog-lines" direction="vertical">
                        {(droppableProvided) => (
                          <tbody ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                            {productSection.editDialogLines.map((line: any, lineIndex: number) => {
                              const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                              const lineMargin = line.unitPrice > 0
                                ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                              return (
                                <Draggable key={line.id} draggableId={line.id} index={lineIndex}>
                                  {(dragProv, snap) => (
                                    <PortalAwareDrag provided={dragProv} snapshot={snap}>
                                      <td className="p-1" {...dragProv.dragHandleProps}>
                                        <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab active:cursor-grabbing" />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          className="h-8 text-xs"
                                          value={line.color}
                                          onChange={(e) => productSection.updateEditDialogLine(line.id, "color", e.target.value)}
                                          placeholder="Color"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          className="h-8 text-xs"
                                          value={line.size}
                                          onChange={(e) => productSection.updateEditDialogLine(line.id, "size", e.target.value)}
                                          placeholder="Size"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          className="h-8 text-xs text-right"
                                          type="number"
                                          min={0}
                                          value={line.quantity}
                                          onChange={(e) => productSection.updateEditDialogLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          className="h-8 text-xs text-right"
                                          type="number"
                                          step="0.01"
                                          min={0}
                                          value={line.cost}
                                          onChange={(e) => productSection.handleEditDialogCostChange(line.id, e)}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          className="h-8 text-xs text-right"
                                          type="number"
                                          step="0.01"
                                          min={0}
                                          value={line.unitPrice}
                                          onChange={(e) => productSection.updateEditDialogLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <div className="relative">
                                          <Input
                                            className="h-8 text-xs text-right pr-5"
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            max={99.9}
                                            value={parseFloat(lineMargin.toFixed(1))}
                                            onChange={(e) => productSection.handleEditDialogMarginChange(line.id, e)}
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                                        </div>
                                      </td>
                                      <td className="p-2 text-right">
                                        <span className="text-xs font-medium">${lineTotal.toFixed(2)}</span>
                                      </td>
                                      <td className="p-2">
                                        {productSection.editDialogLines.length > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => productSection.removeEditDialogLine(line.id)}
                                          >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                          </Button>
                                        )}
                                      </td>
                                    </PortalAwareDrag>
                                  )}
                                </Draggable>
                              );
                            })}
                            {droppableProvided.placeholder}
                          </tbody>
                        )}
                      </Droppable>
                    </DragDropContext>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan={3} className="p-3 text-sm font-semibold">Totals</td>
                        <td className="p-3 text-right text-sm font-semibold">{productSection.editDialogTotals.qty}</td>
                        <td className="p-3 text-right text-sm text-gray-500">${productSection.editDialogTotals.cost.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-semibold ${productSection.marginColor(productSection.editDialogMargin)}`}>
                            {productSection.editDialogMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">${productSection.editDialogTotals.subtotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Margin Summary */}
              <div className={`rounded-lg p-3 ${productSection.marginBg(productSection.editDialogMargin)} flex items-center justify-between text-sm`}>
                <div className="flex items-center gap-6">
                  <span className="text-gray-600">
                    Total Qty: <strong>{productSection.editDialogTotals.qty}</strong>
                  </span>
                  <span className="text-gray-600">
                    Total Cost: <strong>${productSection.editDialogTotals.cost.toFixed(2)}</strong>
                  </span>
                  <span className="text-gray-600">
                    Margin: <strong className={productSection.marginColor(productSection.editDialogMargin)}>{productSection.editDialogMargin.toFixed(1)}%</strong>
                  </span>
                  <span className="text-gray-600">
                    Profit: <strong className="text-green-700">${(productSection.editDialogTotals.subtotal - productSection.editDialogTotals.cost).toFixed(2)}</strong>
                  </span>
                </div>
                <span className="font-bold text-blue-600 text-base">${productSection.editDialogTotals.subtotal.toFixed(2)}</span>
              </div>

              {/* Minimum Margin Warning */}
              {isBelowMinimum(productSection.editDialogMargin, productSection.marginSettings) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Margin ({productSection.editDialogMargin.toFixed(1)}%) is below the company minimum of {productSection.marginSettings.minimumMargin}%.
                    Saving will require confirmation.
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={productSection.editItemData.notes}
                  onChange={(e: any) => productSection.setEditItemData((d: any) => ({ ...d, notes: e.target.value }))}
                  placeholder="Product-specific notes..."
                  rows={3}
                />
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => productSection.setEditingItem(null)}>Cancel</Button>
            <Button
              onClick={productSection.handleSaveEditItem}
              disabled={productSection.updateOrderItemMutation.isPending || productSection.updateLineMutation.isPending || productSection.addLineMutation.isPending}
            >
              {(productSection.updateOrderItemMutation.isPending || productSection.updateLineMutation.isPending || productSection.addLineMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ARTWORK UPLOAD DIALOG */}
      <FilePickerDialog
        open={!!productSection.pickingArtworkForItem}
        onClose={() => productSection.setPickingArtworkForItem(null)}
        onSelect={productSection.handleArtworkFilePicked}
        multiple={false}
        contextProjectId={productSection.projectId}
        title="Select Artwork File"
      />

      {/* Artwork Metadata Dialog */}
      <Dialog open={!!productSection.artPickedFile} onOpenChange={(open) => !open && productSection.resetArtForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {productSection.artPickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={productSection.artPickedFile.filePath}
                  alt={productSection.artPickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{productSection.artPickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={productSection.artUploadName} onChange={(e) => productSection.setArtUploadName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location <span className="text-red-500">*</span></Label>
                <ImprintOptionSelect
                  type="location"
                  value={productSection.artUploadLocation}
                  onChange={productSection.setArtUploadLocation}
                  orderId={productSection.projectId}
                />
              </div>
              <div>
                <Label>Imprint Method <span className="text-red-500">*</span></Label>
                <ImprintOptionSelect
                  type="method"
                  value={productSection.artUploadMethod}
                  onChange={productSection.setArtUploadMethod}
                  orderId={productSection.projectId}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Design Size</Label>
                <Input value={productSection.artUploadSize} onChange={(e) => productSection.setArtUploadSize(e.target.value)} placeholder='e.g., 3" x 3"' />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input value={productSection.artUploadColor} onChange={(e) => productSection.setArtUploadColor(e.target.value)} placeholder="e.g., White, PMS 186" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={productSection.resetArtForm}>Cancel</Button>
            <Button
              disabled={productSection.createArtworkMutation.isPending || !productSection.artPickedFile || !productSection.artUploadLocation || !productSection.artUploadMethod}
              onClick={productSection.handleCreateArtwork}
            >
              {productSection.createArtworkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARGIN WARNING CONFIRMATION DIALOG */}
      <AlertDialog open={!!productSection.marginWarningAction} onOpenChange={(open) => { if (!open) productSection.dismissMarginWarning(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Below Minimum Margin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  The margin for this product is <strong className="text-red-600">{productSection.marginWarningValue.toFixed(1)}%</strong>, which is below
                  the company minimum of <strong>{productSection.marginSettings.minimumMargin}%</strong>.
                </p>
                <p className="mt-2 text-orange-600 font-medium">
                  Are you sure you want to save with this margin? This may require manager approval.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={productSection.dismissMarginWarning}>
              Go Back & Adjust
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={productSection.confirmMarginWarning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {productSection.previewFile && (
        <FilePreviewModal
          open={true}
          file={{
            fileName: productSection.previewFile.name,
            originalName: productSection.previewFile.name,
            filePath: productSection.previewFile.url,
            mimeType: productSection.previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf",
          }}
          onClose={() => productSection.setPreviewFile(null)}
        />
      )}
    </>
  );
}
