import DecoratorMatrixDialog from "@/components/modals/DecoratorMatrixDialog";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import { isBelowMinimum } from "@/hooks/useMarginSettings";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectData } from "@/types/project-types";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Copy,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Grid3X3,
  Image,
  Loader2,
  Lock,
  LockOpen,
  Package,
  Palette,
  Percent,
  Plus,
  Repeat,
  Ruler,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import { useState } from "react";
import { useEditProductPage } from "./hooks";

interface EditProductPageProps {
  projectId: string;
  itemId: string;
  data: ProjectData;
}

export default function EditProductPage({ projectId, itemId, data }: EditProductPageProps) {
  const editProductPage = useEditProductPage(projectId, itemId, data);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);

  if (!editProductPage.item) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const itemSupplier = editProductPage.getItemSupplier(editProductPage.item);
  const imageUrl = editProductPage.getProductImage(editProductPage.item);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={editProductPage.goBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Edit Product</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={editProductPage.goBack}>Cancel</Button>
          <Button onClick={editProductPage.handleSave} disabled={editProductPage.isSaving || !editProductPage.hasChanges}>
            {editProductPage.isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Product Header Card */}
      <Card>
        <CardHeader className="p-5">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Product Details</h2>
          </div>
        </CardHeader>
        <CardContent className="px-5 gap-2 flex flex-col">
          <div className="flex gap-4">
            {imageUrl ? (
              <img src={imageUrl} alt={editProductPage.item.productName} className="w-20 h-20 object-contain rounded-lg border bg-white" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{editProductPage.item.productName || "Unnamed Product"}</h2>
              <div className="flex items-center gap-2 mt-1">
                {editProductPage.item.productSku && (
                  <Badge variant="outline" className="text-xs">{editProductPage.item.productSku}</Badge>
                )}
                {itemSupplier && (
                  <span className="text-sm text-gray-500">{itemSupplier.name}</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={editProductPage.editItemData.description || ""}
              onChange={(e: any) => editProductPage.setEditItemData((d: any) => ({ ...d, description: e.target.value }))}
              placeholder={editProductPage.item.productDescription || "Product description..."}
              rows={2}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={editProductPage.editItemData.notes || ""}
              onChange={(e: any) => editProductPage.setEditItemData((d: any) => ({ ...d, notes: e.target.value }))}
              placeholder="Product-specific notes..."
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-500" />
              Private Notes
              <span className="text-[10px] text-amber-600 font-normal">(team only — hidden from client)</span>
            </Label>
            <Textarea
              value={editProductPage.editItemData.privateNotes || ""}
              onChange={(e: any) => editProductPage.setEditItemData((d: any) => ({ ...d, privateNotes: e.target.value }))}
              placeholder="Internal notes visible only to your team..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 items-center">
              <Ruler className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-lg">Pricing</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={editProductPage.isPriceLocked ? "default" : "outline"}
                size="sm"
                onClick={() => editProductPage.setIsPriceLocked(!editProductPage.isPriceLocked)}
                title={editProductPage.isPriceLocked ? "Price locked — cost changes affect margin only. Click to unlock." : "Click to lock retail price"}
                className={editProductPage.isPriceLocked ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {editProductPage.isPriceLocked ? <Lock className="w-3 h-3 mr-1" /> : <LockOpen className="w-3 h-3 mr-1" />}
                {editProductPage.isPriceLocked ? "Price Locked" : "Lock Price"}
              </Button>
              <Button variant="outline" size="sm" onClick={editProductPage.addLine}>
                <Plus className="w-3 h-3 mr-1" />
                Add Line
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
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
              <tbody>
                {editProductPage.editableLines.map((line: any) => {
                  const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                  const lineMargin = line.unitPrice > 0
                    ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                  return (
                    <tr key={line.id} className="border-b last:border-0">
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs"
                          value={line.color}
                          onChange={(e) => editProductPage.updateLine(line.id, "color", e.target.value)}
                          placeholder="Color"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs"
                          value={line.size}
                          onChange={(e) => editProductPage.updateLine(line.id, "size", e.target.value)}
                          placeholder="Size"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs text-right"
                          type="number"
                          min={0}
                          value={line.quantity}
                          onChange={(e) => editProductPage.updateLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs text-right"
                          type="number"
                          step="0.01"
                          min={0}
                          value={line.cost}
                          onChange={(e) => editProductPage.handleCostChange(line.id, e)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className={`h-8 text-xs text-right ${editProductPage.isPriceLocked ? "border-blue-300 bg-blue-50/50" : ""}`}
                          type="number"
                          step="0.01"
                          min={0}
                          value={line.unitPrice}
                          onChange={(e) => editProductPage.updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <Input
                            className={`h-8 text-xs text-right pr-5 ${isBelowMinimum(lineMargin, editProductPage.marginSettings) ? "border-red-300 text-red-600" : ""}`}
                            type="number"
                            step="0.1"
                            min={0}
                            max={99.9}
                            value={parseFloat(lineMargin.toFixed(1))}
                            onChange={(e) => editProductPage.handleMarginChange(line.id, e)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <span className="text-xs font-medium">${lineTotal.toFixed(2)}</span>
                      </td>
                      <td className="p-2">
                        {editProductPage.editableLines.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => editProductPage.removeLine(line.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={2} className="p-3 text-sm font-semibold">Totals</td>
                  <td className="p-3 text-right text-sm font-semibold">{editProductPage.lineTotals.qty}</td>
                  <td className="p-3 text-right text-sm text-gray-500">${editProductPage.lineTotals.cost.toFixed(2)}</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right">
                    <span className={`text-sm font-semibold ${editProductPage.marginColor(editProductPage.margin)}`}>
                      {editProductPage.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-sm font-semibold">${editProductPage.lineTotals.revenue.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Margin Summary Bar */}
          <div className={`rounded-lg p-3 mt-4 ${editProductPage.marginBg(editProductPage.margin)} flex items-center justify-between text-sm`}>
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                Total Qty: <strong>{editProductPage.lineTotals.qty}</strong>
              </span>
              <span className="text-gray-600">
                Total Cost: <strong>${editProductPage.lineTotals.cost.toFixed(2)}</strong>
              </span>
              <span className="text-gray-600">
                Margin: <strong className={editProductPage.marginColor(editProductPage.margin)}>{editProductPage.margin.toFixed(1)}%</strong>
              </span>
              <span className="text-gray-600">
                Profit: <strong className="text-green-700">${(editProductPage.lineTotals.revenue - editProductPage.lineTotals.cost).toFixed(2)}</strong>
              </span>
            </div>
            <span className="font-bold text-blue-600 text-base">${editProductPage.lineTotals.revenue.toFixed(2)}</span>
          </div>

          {isBelowMinimum(editProductPage.margin, editProductPage.marginSettings) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-3 flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Margin ({editProductPage.margin.toFixed(1)}%) is below the company minimum of {editProductPage.marginSettings.minimumMargin}%.
                Saving will require confirmation.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Charges + Fixed Charges */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Charges
            </h3>
            <Button variant="outline" size="sm" onClick={() => editProductPage.setShowAddCharge(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add Charge
            </Button>
          </div>

          {(() => {
            const runCharges = editProductPage.charges.filter((c: any) => c.chargeCategory === "run");
            const fixedCharges = editProductPage.charges.filter((c: any) => c.chargeCategory !== "run");

            if (editProductPage.charges.length === 0) {
              return <p className="text-xs text-gray-400">No charges added</p>;
            }

            const renderCharge = (charge: any) => (
              <div key={charge.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{charge.description}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {charge.chargeType === "percentage" ? <Percent className="w-2.5 h-2.5 mr-0.5" /> : <DollarSign className="w-2.5 h-2.5 mr-0.5" />}
                    {charge.chargeType}
                  </Badge>
                  {charge.isVendorCharge && (
                    <Badge variant="secondary" className="text-[10px]">vendor</Badge>
                  )}
                  {charge.includeInUnitPrice && (
                    <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                      {charge.chargeCategory === "run" ? "included in price" : "absorbed in margin"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${charge.includeInUnitPrice ? "text-gray-400 line-through" : ""}`}>
                    ${parseFloat(charge.amount || "0").toFixed(2)}
                  </span>
                  <Button
                    variant="ghost" size="sm" className="h-6 w-6 p-0"
                    title={charge.displayToClient !== false ? "Visible to client" : "Hidden from client"}
                    onClick={() => editProductPage.toggleChargeDisplayMutation.mutate({
                      chargeId: charge.id,
                      orderItemId: charge.orderItemId,
                      displayToClient: charge.displayToClient === false,
                    })}
                  >
                    {charge.displayToClient !== false
                      ? <Eye className="w-3 h-3 text-blue-400" />
                      : <EyeOff className="w-3 h-3 text-gray-300" />
                    }
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-6 w-6 p-0"
                    onClick={() => editProductPage.deleteChargeMutation.mutate({ chargeId: charge.id, orderItemId: charge.orderItemId })}
                  >
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            );

            return (
              <div className="space-y-4">
                {runCharges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Run Charges (per unit)</h4>
                    <div className="space-y-1.5">{runCharges.map(renderCharge)}</div>
                  </div>
                )}
                {fixedCharges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fixed Charges (one-time)</h4>
                    <div className="space-y-1.5">{fixedCharges.map(renderCharge)}</div>
                  </div>
                )}
                <div className="text-right text-xs text-gray-500 pt-1">
                  Total Charges: <strong className="text-gray-800">${editProductPage.totalCharges.toFixed(2)}</strong>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Artwork */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-lg flex items-center gap-1.5">
                <Image className="w-4 h-4 text-gray-400" />
                Decorations {editProductPage.artworks.length > 0 && `(${editProductPage.artworks.length})`}
              </h3>
              {/* Decorator Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    Decorator Type
                  </Label>
                  <Select
                    value={editProductPage.editItemData.decoratorType || "supplier"}
                    onValueChange={(v) => editProductPage.setEditItemData((d: any) => ({
                      ...d,
                      decoratorType: v,
                      decoratorId: v === "supplier" ? "" : d.decoratorId,
                      // Auto-suggest shipping destination
                      shippingDestination: v === "third_party" ? "decorator" : (d.shippingDestination === "decorator" ? "" : d.shippingDestination),
                    }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier Decorator</SelectItem>
                      <SelectItem value="third_party">Third-Party Decorator</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-gray-400 flex-1">
                      {editProductPage.editItemData.decoratorType === "third_party"
                        ? "Blank goods ship to separate decorator for imprinting"
                        : "Supplier provides both blank goods and decoration"}
                    </p>
                    <Button
                      type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-blue-600"
                      onClick={() => setShowMatrixDialog(true)}
                    >
                      <Grid3X3 className="w-3 h-3" /> Matrix
                    </Button>
                  </div>
                </div>
                {editProductPage.editItemData.decoratorType === "third_party" && (
                  <div>
                    <Label>Third-Party Decorator</Label>
                    <Select
                      value={editProductPage.editItemData.decoratorId || ""}
                      onValueChange={(v) => editProductPage.setEditItemData((d: any) => ({ ...d, decoratorId: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select decorator..." /></SelectTrigger>
                      <SelectContent>
                        {editProductPage.suppliers
                          .filter((s: any) => s.id !== editProductPage.item?.supplierId)
                          .map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => editProductPage.setPickingArtwork(true)}>
              <Upload className="w-3 h-3 mr-1" />
              Add Artwork
            </Button>
          </div>

          {editProductPage.artworks.length > 0 ? (
            <div className="space-y-3">
              {editProductPage.artworks.map((art: any) => {
                const artCharges = editProductPage.allArtworkCharges[art.id] || [];
                const artFiles = editProductPage.allArtworkFiles[art.id] || [];
                const runCharges = artCharges.filter((c: any) => c.chargeCategory === "run");
                const fixedCharges = artCharges.filter((c: any) => c.chargeCategory !== "run");

                // Build file list: artworkItemFiles if any, fallback to artworkItems.filePath
                const displayFiles = artFiles.length > 0
                  ? artFiles
                  : art.filePath ? [{ id: "primary", filePath: art.filePath, fileName: art.fileName }] : [];

                return (
                  <div key={art.id} className="border rounded-lg bg-white overflow-hidden">
                    {/* Artwork header row */}
                    <div className="p-3 flex gap-3 items-start">
                      {/* Thumbnails (multiple files) */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        {displayFiles.length > 0 ? displayFiles.slice(0, 3).map((f: any, idx: number) => (
                          <div key={f.id || idx} className="w-14 h-14 bg-gray-50 rounded border overflow-hidden flex items-center justify-center relative">
                            {(() => {
                              const ext = (f.filePath || "").split("?")[0].split(".").pop()?.toLowerCase();
                              const isDesign = ["ai", "eps", "psd"].includes(ext || "");
                              const src = isDesign && (f.filePath || "").includes("cloudinary.com")
                                ? getCloudinaryThumbnail(f.filePath, 112, 112)
                                : f.filePath;
                              return <img src={src} alt={f.fileName} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                            })()}
                            {f.id !== "primary" && (
                              <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] opacity-0 hover:opacity-100 transition-opacity"
                                onClick={() => editProductPage.removeArtworkFileMutation.mutate({ artworkId: art.id, fileId: f.id })}>×</button>
                            )}
                          </div>
                        )) : (
                          <div className="w-14 h-14 bg-gray-50 rounded border flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        {displayFiles.length > 3 && (
                          <div className="w-14 h-14 bg-gray-100 rounded border flex items-center justify-center text-[10px] text-gray-500 font-medium">
                            +{displayFiles.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{art.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {art.location && <span className="text-[10px] text-gray-500">{art.location}</span>}
                          {art.artworkType && <span className="text-[10px] text-gray-400">· {art.artworkType}</span>}
                          {art.size && <span className="text-[10px] text-gray-400">· {art.size}</span>}
                          {art.repeatLogo && (
                            <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-600">
                              <Repeat className="w-2.5 h-2.5 mr-0.5" /> repeat
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${art.status === "approved" ? "border-green-300 text-green-700" :
                              art.status === "rejected" ? "border-red-300 text-red-700" :
                                "border-yellow-300 text-yellow-700"
                              }`}
                          >
                            {art.status}
                          </Badge>
                          {artCharges.length > 0 && (
                            <Badge variant="secondary" className="text-[9px]">
                              <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                              {artCharges.length} charge{artCharges.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-[10px]"
                            onClick={() => editProductPage.setShowAddArtworkCharge(art.id)}>
                            <Plus className="w-3 h-3 mr-0.5" /> Charge
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-[10px]"
                            onClick={() => editProductPage.setAddingFileToArtworkId(art.id)}>
                            <Upload className="w-3 h-3 mr-0.5" /> File
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px]"
                            onClick={() => editProductPage.setCopyingArtworkId(art.id)}>
                            <Copy className="w-3 h-3 mr-0.5" /> Copy to...
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => editProductPage.deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: itemId })}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Artwork charges list */}
                    {artCharges.length > 0 && (
                      <div className="border-t bg-gray-50/50 px-3 py-2 space-y-1">
                        {runCharges.length > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Imprint Costs (per unit)</p>
                            {runCharges.map((charge: any) => (
                              <div key={charge.id} className="flex items-center justify-between text-xs py-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">{charge.chargeName}</span>
                                  <span className="text-gray-400">Cost: ${parseFloat(charge.netCost || "0").toFixed(2)}</span>
                                  <span className="text-gray-400">→ Retail: ${parseFloat(charge.retailPrice || "0").toFixed(2)}</span>
                                  <Badge variant="outline" className="text-[8px]">
                                    {charge.displayMode === "include_in_price" ? "in price" : "line item"}
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                  onClick={() => editProductPage.deleteArtworkChargeMutation.mutate({ artworkId: art.id, chargeId: charge.id })}
                                >
                                  <Trash2 className="w-3 h-3 text-gray-400" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {fixedCharges.length > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Setup Costs (one-time)</p>
                            {fixedCharges.map((charge: any) => (
                              <div key={charge.id} className="flex items-center justify-between text-xs py-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">{charge.chargeName}</span>
                                  <span className="text-gray-400">Cost: ${parseFloat(charge.netCost || "0").toFixed(2)}</span>
                                  <span className="text-gray-400">→ Retail: ${parseFloat(charge.retailPrice || "0").toFixed(2)}</span>
                                  <Badge variant="outline" className="text-[8px]">
                                    {charge.displayMode === "subtract_from_margin" ? "absorbed" : "line item"}
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                  onClick={() => editProductPage.deleteArtworkChargeMutation.mutate({ artworkId: art.id, chargeId: charge.id })}
                                >
                                  <Trash2 className="w-3 h-3 text-gray-400" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No artwork yet — click "Add Artwork" to upload</p>
          )}
        </CardContent>
      </Card>

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-2 pb-8">
        <Button variant="outline" onClick={editProductPage.goBack}>Cancel</Button>
        <Button onClick={editProductPage.handleSave} disabled={editProductPage.isSaving || !editProductPage.hasChanges}>
          {editProductPage.isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* ADD CHARGE DIALOG */}
      <Dialog open={editProductPage.showAddCharge} onOpenChange={(open) => !open && editProductPage.setShowAddCharge(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Charge Category Toggle */}
            <div>
              <Label className="mb-1.5 block">Charge Category</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editProductPage.newCharge.chargeCategory === "run" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => editProductPage.setNewCharge(c => ({ ...c, chargeCategory: "run" as const }))}
                >
                  Run Charge (per unit)
                </Button>
                <Button
                  type="button"
                  variant={editProductPage.newCharge.chargeCategory === "fixed" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => editProductPage.setNewCharge(c => ({ ...c, chargeCategory: "fixed" as const }))}
                >
                  Fixed Charge (one-time)
                </Button>
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Input
                value={editProductPage.newCharge.description}
                onChange={(e) => editProductPage.setNewCharge(c => ({ ...c, description: e.target.value }))}
                placeholder={editProductPage.newCharge.chargeCategory === "run" ? "e.g., Setup Fee per unit, Imprint Charge" : "e.g., Screen Setup, PMS Color Match"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={editProductPage.newCharge.chargeType} onValueChange={(v) => editProductPage.setNewCharge(c => ({ ...c, chargeType: v }))}>
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
                  value={editProductPage.newCharge.amount}
                  onChange={(e) => editProductPage.setNewCharge(c => ({ ...c, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ep-vendor-charge" checked={editProductPage.newCharge.isVendorCharge} onChange={(e) => editProductPage.setNewCharge(c => ({ ...c, isVendorCharge: e.target.checked }))} className="rounded border-gray-300" />
              <Label htmlFor="ep-vendor-charge" className="font-normal text-sm">This is a vendor charge (cost, not revenue)</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ep-include-price" checked={editProductPage.newCharge.includeInUnitPrice} onChange={(e) => editProductPage.setNewCharge(c => ({ ...c, includeInUnitPrice: e.target.checked }))} className="rounded border-gray-300" />
              <Label htmlFor="ep-include-price" className="font-normal text-sm">
                {editProductPage.newCharge.chargeCategory === "run" ? "Include in unit price" : "Subtract from margin"}
              </Label>
            </div>
            {!editProductPage.newCharge.includeInUnitPrice && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ep-display-client" checked={editProductPage.newCharge.displayToClient} onChange={(e) => editProductPage.setNewCharge(c => ({ ...c, displayToClient: e.target.checked }))} className="rounded border-gray-300" />
                <Label htmlFor="ep-display-client" className="font-normal text-sm">Display to client</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => editProductPage.setShowAddCharge(false)}>Cancel</Button>
            <Button
              disabled={!editProductPage.newCharge.description || editProductPage.newCharge.amount <= 0 || editProductPage.addChargeMutation.isPending}
              onClick={() => {
                editProductPage.addChargeMutation.mutate({
                  orderItemId: itemId,
                  charge: {
                    description: editProductPage.newCharge.description,
                    chargeType: editProductPage.newCharge.chargeType,
                    chargeCategory: editProductPage.newCharge.chargeCategory,
                    amount: editProductPage.newCharge.amount.toFixed(2),
                    isVendorCharge: editProductPage.newCharge.isVendorCharge,
                    displayToClient: editProductPage.newCharge.includeInUnitPrice ? false : editProductPage.newCharge.displayToClient,
                    includeInUnitPrice: editProductPage.newCharge.includeInUnitPrice,
                  },
                }, {
                  onSuccess: () => {
                    editProductPage.setShowAddCharge(false);
                    editProductPage.setNewCharge({ description: "", chargeType: "flat", chargeCategory: "fixed", amount: 0, isVendorCharge: false, displayToClient: true, includeInUnitPrice: false });
                  },
                });
              }}
            >
              {editProductPage.addChargeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ARTWORK FILE PICKER */}
      <FilePickerDialog
        open={editProductPage.pickingArtwork}
        onClose={() => editProductPage.setPickingArtwork(false)}
        onSelect={editProductPage.handleArtworkFilePicked}
        multiple={false}
        contextProjectId={projectId}
        title="Select Artwork File"
      />

      {/* ARTWORK METADATA DIALOG */}
      <Dialog open={!!editProductPage.artPickedFile} onOpenChange={(open) => !open && editProductPage.resetArtForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editProductPage.artPickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={editProductPage.artPickedFile.filePath}
                  alt={editProductPage.artPickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{editProductPage.artPickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={editProductPage.artUploadName} onChange={(e) => editProductPage.setArtUploadName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location <span className="text-red-500">*</span></Label>
                <Select value={editProductPage.artUploadLocation} onValueChange={editProductPage.setArtUploadLocation}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {IMPRINT_LOCATIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imprint Method <span className="text-red-500">*</span></Label>
                <Select value={editProductPage.artUploadMethod} onValueChange={editProductPage.setArtUploadMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {IMPRINT_METHODS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Design Size</Label>
                <Input value={editProductPage.artUploadSize} onChange={(e) => editProductPage.setArtUploadSize(e.target.value)} placeholder='e.g., 3" x 3"' />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input value={editProductPage.artUploadColor} onChange={(e) => editProductPage.setArtUploadColor(e.target.value)} placeholder="e.g., White, PMS 186" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="art-repeat-logo" checked={editProductPage.artUploadRepeatLogo} onChange={(e) => editProductPage.setArtUploadRepeatLogo(e.target.checked)} className="rounded border-gray-300" />
              <Label htmlFor="art-repeat-logo" className="font-normal text-sm flex items-center gap-1">
                <Repeat className="w-3 h-3 text-purple-500" />
                Repeat logo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={editProductPage.resetArtForm}>Cancel</Button>
            <Button
              disabled={editProductPage.createArtworkMutation.isPending || !editProductPage.artPickedFile || !editProductPage.artUploadLocation || !editProductPage.artUploadMethod}
              onClick={editProductPage.handleCreateArtwork}
            >
              {editProductPage.createArtworkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD ARTWORK CHARGE DIALOG */}
      <Dialog open={!!editProductPage.showAddArtworkCharge} onOpenChange={(open) => !open && editProductPage.setShowAddArtworkCharge(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Artwork Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Charge Type</Label>
              <div className="flex gap-2">
                <Button type="button" variant={editProductPage.newArtworkCharge.chargeCategory === "run" ? "default" : "outline"} size="sm" className="flex-1"
                  onClick={() => editProductPage.setNewArtworkCharge(c => ({ ...c, chargeCategory: "run" as const }))}
                >
                  Imprint Cost (per unit)
                </Button>
                <Button type="button" variant={editProductPage.newArtworkCharge.chargeCategory === "fixed" ? "default" : "outline"} size="sm" className="flex-1"
                  onClick={() => editProductPage.setNewArtworkCharge(c => ({ ...c, chargeCategory: "fixed" as const }))}
                >
                  Setup Cost (one-time)
                </Button>
              </div>
            </div>
            <div>
              <Label>Charge Name *</Label>
              <Input
                value={editProductPage.newArtworkCharge.chargeName}
                onChange={(e) => editProductPage.setNewArtworkCharge(c => ({ ...c, chargeName: e.target.value }))}
                placeholder={editProductPage.newArtworkCharge.chargeCategory === "run" ? "e.g., Imprint Charge, 2nd Color Run" : "e.g., Screen Setup, Digitizing Fee"}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Net Cost *</Label>
                <Input type="number" step="0.01" min={0}
                  value={editProductPage.newArtworkCharge.netCost}
                  onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0;
                    const margin = editProductPage.newArtworkCharge.margin;
                    const retail = margin > 0 && margin < 100 ? cost / (1 - margin / 100) : cost;
                    editProductPage.setNewArtworkCharge(c => ({ ...c, netCost: cost, retailPrice: parseFloat(retail.toFixed(2)) }));
                  }}
                />
              </div>
              <div>
                <Label>Margin %</Label>
                <Input type="number" step="0.1" min={0} max={99.9}
                  value={editProductPage.newArtworkCharge.margin}
                  onChange={(e) => {
                    const margin = parseFloat(e.target.value) || 0;
                    const cost = editProductPage.newArtworkCharge.netCost;
                    const retail = margin > 0 && margin < 100 ? cost / (1 - margin / 100) : cost;
                    editProductPage.setNewArtworkCharge(c => ({ ...c, margin, retailPrice: parseFloat(retail.toFixed(2)) }));
                  }}
                />
              </div>
              <div>
                <Label>Retail Price *</Label>
                <Input type="number" step="0.01" min={0}
                  value={editProductPage.newArtworkCharge.retailPrice}
                  onChange={(e) => {
                    const retail = parseFloat(e.target.value) || 0;
                    const cost = editProductPage.newArtworkCharge.netCost;
                    const margin = retail > 0 ? ((retail - cost) / retail * 100) : 0;
                    editProductPage.setNewArtworkCharge(c => ({ ...c, retailPrice: retail, margin: parseFloat(margin.toFixed(1)) }));
                  }}
                />
              </div>
            </div>
            {/* Matrix lookup button */}
            {(() => {
              const vendorId = editProductPage.editItemData.decoratorType === "third_party"
                ? editProductPage.editItemData.decoratorId
                : editProductPage.item?.supplierId;
              const artId = editProductPage.showAddArtworkCharge;
              const art = artId ? editProductPage.artworks.find((a: any) => a.id === artId) : null;
              const method = art?.artworkType || editProductPage.editItemData.imprintMethod;
              if (!vendorId || !method) return null;
              return (
                <Button
                  type="button" variant="outline" size="sm" className="gap-1.5"
                  onClick={async () => {
                    try {
                      const qty = editProductPage.lineTotals.qty || 1;
                      const res = await apiRequest("GET", `/api/matrices/lookup?supplierId=${vendorId}&method=${method}&quantity=${qty}`);
                      const data = await res.json();
                      if (data.found) {
                        const cat = editProductPage.newArtworkCharge.chargeCategory;
                        const cost = parseFloat(cat === "run" ? data.runCost : data.setupCost) || 0;
                        editProductPage.setNewArtworkCharge(c => ({
                          ...c,
                          netCost: cost,
                          retailPrice: cost,
                          chargeName: c.chargeName || (cat === "run" ? `${method} imprint` : `${method} setup`),
                        }));
                      } else {
                        // No match — open matrix management
                      }
                    } catch { /* ignore */ }
                  }}
                >
                  <Grid3X3 className="w-3 h-3" />
                  Lookup Matrix
                </Button>
              );
            })()}
            {editProductPage.newArtworkCharge.chargeCategory === "fixed" && (
              <div className="w-24">
                <Label>Qty</Label>
                <Input type="number" min={1}
                  value={editProductPage.newArtworkCharge.quantity}
                  onChange={(e) => editProductPage.setNewArtworkCharge(c => ({ ...c, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            )}
            <div>
              <Label>Display Mode</Label>
              <Select
                value={editProductPage.newArtworkCharge.displayMode}
                onValueChange={(v: any) => editProductPage.setNewArtworkCharge(c => ({ ...c, displayMode: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {editProductPage.newArtworkCharge.chargeCategory === "run" ? (
                    <>
                      <SelectItem value="display_to_client">Display to client (line item)</SelectItem>
                      <SelectItem value="include_in_price">Include in unit price (hidden)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="display_to_client">Display to client (line item)</SelectItem>
                      <SelectItem value="subtract_from_margin">Subtract from margin (hidden)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => editProductPage.setShowAddArtworkCharge(null)}>Cancel</Button>
            <Button
              disabled={!editProductPage.newArtworkCharge.chargeName || editProductPage.newArtworkCharge.retailPrice <= 0 || editProductPage.createArtworkChargeMutation.isPending}
              onClick={() => {
                const artId = editProductPage.showAddArtworkCharge;
                if (!artId) return;
                editProductPage.createArtworkChargeMutation.mutate({
                  artworkId: artId,
                  charge: {
                    chargeName: editProductPage.newArtworkCharge.chargeName,
                    chargeCategory: editProductPage.newArtworkCharge.chargeCategory,
                    netCost: editProductPage.newArtworkCharge.netCost.toFixed(2),
                    margin: editProductPage.newArtworkCharge.margin.toFixed(1),
                    retailPrice: editProductPage.newArtworkCharge.retailPrice.toFixed(2),
                    quantity: editProductPage.newArtworkCharge.chargeCategory === "fixed" ? editProductPage.newArtworkCharge.quantity : 1,
                    displayMode: editProductPage.newArtworkCharge.displayMode,
                  },
                }, {
                  onSuccess: () => {
                    editProductPage.setShowAddArtworkCharge(null);
                    editProductPage.setNewArtworkCharge({ chargeName: "", chargeCategory: "run", netCost: 0, margin: 0, retailPrice: 0, quantity: 1, displayMode: "display_to_client" });
                  },
                });
              }}
            >
              {editProductPage.createArtworkChargeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD FILE TO EXISTING ARTWORK */}
      <FilePickerDialog
        open={!!editProductPage.addingFileToArtworkId}
        onClose={() => editProductPage.setAddingFileToArtworkId(null)}
        onSelect={(files: any[]) => {
          const file = files[0];
          if (file && editProductPage.addingFileToArtworkId) {
            editProductPage.addArtworkFileMutation.mutate({
              artworkId: editProductPage.addingFileToArtworkId,
              file: {
                fileName: file.originalName || file.fileName,
                filePath: file.cloudinaryUrl,
                fileSize: file.fileSize || null,
                mimeType: file.mimeType || null,
              },
            });
          }
          editProductPage.setAddingFileToArtworkId(null);
        }}
        multiple={false}
        contextProjectId={projectId}
        title="Add File to Artwork"
      />

      {/* COPY ARTWORK TO ANOTHER PRODUCT */}
      <Dialog open={!!editProductPage.copyingArtworkId} onOpenChange={(open) => !open && editProductPage.setCopyingArtworkId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy Artwork to Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Select a product to copy this artwork to:</p>
            {editProductPage.orderItems
              .filter((i: any) => i.id !== itemId)
              .map((i: any) => (
                <div key={i.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{i.productName || "Unnamed"}</p>
                    {i.productSku && <p className="text-[10px] text-gray-400">{i.productSku}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-[10px]"
                      disabled={editProductPage.copyArtworkMutation.isPending}
                      onClick={() => {
                        editProductPage.copyArtworkMutation.mutate(
                          { targetItemId: i.id, sourceArtworkId: editProductPage.copyingArtworkId!, includePricing: false },
                          { onSuccess: () => editProductPage.setCopyingArtworkId(null) }
                        );
                      }}>
                      Art Only
                    </Button>
                    <Button size="sm" className="h-7 text-[10px]"
                      disabled={editProductPage.copyArtworkMutation.isPending}
                      onClick={() => {
                        editProductPage.copyArtworkMutation.mutate(
                          { targetItemId: i.id, sourceArtworkId: editProductPage.copyingArtworkId!, includePricing: true },
                          { onSuccess: () => editProductPage.setCopyingArtworkId(null) }
                        );
                      }}>
                      Art + Pricing
                    </Button>
                  </div>
                </div>
              ))}
            {editProductPage.orderItems.filter((i: any) => i.id !== itemId).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No other products in this order</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MARGIN WARNING DIALOG */}
      <AlertDialog open={!!editProductPage.marginWarningAction} onOpenChange={(open) => { if (!open) editProductPage.dismissMarginWarning(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Below Minimum Margin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  The margin for this product is <strong className="text-red-600">{editProductPage.marginWarningValue.toFixed(1)}%</strong>, which is below
                  the company minimum of <strong>{editProductPage.marginSettings.minimumMargin}%</strong>.
                </p>
                <p className="mt-2 text-orange-600 font-medium">
                  Are you sure you want to save with this margin?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={editProductPage.dismissMarginWarning}>Go Back & Adjust</AlertDialogCancel>
            <AlertDialogAction onClick={editProductPage.confirmMarginWarning} className="bg-orange-600 hover:bg-orange-700">
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DECORATOR MATRIX DIALOG */}
      {(() => {
        const matrixVendorId = editProductPage.editItemData.decoratorType === "third_party"
          ? editProductPage.editItemData.decoratorId
          : editProductPage.item?.supplierId;
        const matrixVendorName = editProductPage.editItemData.decoratorType === "third_party"
          ? editProductPage.suppliers.find((s: any) => s.id === editProductPage.editItemData.decoratorId)?.name || "Decorator"
          : itemSupplier?.name || "Supplier";
        if (!matrixVendorId) return null;
        return (
          <DecoratorMatrixDialog
            open={showMatrixDialog}
            onClose={() => setShowMatrixDialog(false)}
            supplierId={matrixVendorId}
            supplierName={matrixVendorName}
          />
        );
      })()}
    </div>
  );
}
