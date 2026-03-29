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
import { Card, CardContent } from "@/components/ui/card";
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
import type { ProjectData } from "@/types/project-types";
import {
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Image,
  Loader2,
  Package,
  Palette,
  Percent,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEditProductPage } from "./hooks";

interface EditProductPageProps {
  projectId: string;
  itemId: string;
  data: ProjectData;
}

export default function EditProductPage({ projectId, itemId, data }: EditProductPageProps) {
  const h = useEditProductPage(projectId, itemId, data);

  if (!h.item) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const itemSupplier = h.getItemSupplier(h.item);
  const imageUrl = h.getProductImage(h.item);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={h.goBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Edit Product</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={h.goBack}>Cancel</Button>
          <Button onClick={h.handleSave} disabled={h.isSaving || !h.hasChanges}>
            {h.isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Product Header Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-4">
            {imageUrl ? (
              <img src={imageUrl} alt={h.item.productName} className="w-20 h-20 object-contain rounded-lg border bg-white" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{h.item.productName || "Unnamed Product"}</h2>
              <div className="flex items-center gap-2 mt-1">
                {h.item.productSku && (
                  <Badge variant="outline" className="text-xs">{h.item.productSku}</Badge>
                )}
                {itemSupplier && (
                  <span className="text-sm text-gray-500">{itemSupplier.name}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imprint & Notes */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm">Product Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Imprint Method</Label>
              <Select value={h.editItemData.imprintMethod || ""} onValueChange={(v) => h.setEditItemData((d: any) => ({ ...d, imprintMethod: v }))}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {IMPRINT_METHODS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Imprint Location</Label>
              <Select value={h.editItemData.imprintLocation || ""} onValueChange={(v) => h.setEditItemData((d: any) => ({ ...d, imprintLocation: v }))}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {IMPRINT_LOCATIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={h.editItemData.notes || ""}
              onChange={(e: any) => h.setEditItemData((d: any) => ({ ...d, notes: e.target.value }))}
              placeholder="Product-specific notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Size & Color Breakdown</h3>
            <Button variant="outline" size="sm" onClick={h.addLine}>
              <Plus className="w-3 h-3 mr-1" />
              Add Line
            </Button>
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
                {h.editableLines.map((line: any) => {
                  const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                  const lineMargin = line.unitPrice > 0
                    ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                  return (
                    <tr key={line.id} className="border-b last:border-0">
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs"
                          value={line.color}
                          onChange={(e) => h.updateLine(line.id, "color", e.target.value)}
                          placeholder="Color"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs"
                          value={line.size}
                          onChange={(e) => h.updateLine(line.id, "size", e.target.value)}
                          placeholder="Size"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs text-right"
                          type="number"
                          min={0}
                          value={line.quantity}
                          onChange={(e) => h.updateLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs text-right"
                          type="number"
                          step="0.01"
                          min={0}
                          value={line.cost}
                          onChange={(e) => h.handleCostChange(line.id, e)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs text-right"
                          type="number"
                          step="0.01"
                          min={0}
                          value={line.unitPrice}
                          onChange={(e) => h.updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <Input
                            className={`h-8 text-xs text-right pr-5 ${isBelowMinimum(lineMargin, h.marginSettings) ? "border-red-300 text-red-600" : ""}`}
                            type="number"
                            step="0.1"
                            min={0}
                            max={99.9}
                            value={parseFloat(lineMargin.toFixed(1))}
                            onChange={(e) => h.handleMarginChange(line.id, e)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <span className="text-xs font-medium">${lineTotal.toFixed(2)}</span>
                      </td>
                      <td className="p-2">
                        {h.editableLines.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => h.removeLine(line.id)}
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
                  <td className="p-3 text-right text-sm font-semibold">{h.lineTotals.qty}</td>
                  <td className="p-3 text-right text-sm text-gray-500">${h.lineTotals.cost.toFixed(2)}</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right">
                    <span className={`text-sm font-semibold ${h.marginColor(h.margin)}`}>
                      {h.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-sm font-semibold">${h.lineTotals.revenue.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Margin Summary Bar */}
          <div className={`rounded-lg p-3 mt-4 ${h.marginBg(h.margin)} flex items-center justify-between text-sm`}>
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                Total Qty: <strong>{h.lineTotals.qty}</strong>
              </span>
              <span className="text-gray-600">
                Total Cost: <strong>${h.lineTotals.cost.toFixed(2)}</strong>
              </span>
              <span className="text-gray-600">
                Margin: <strong className={h.marginColor(h.margin)}>{h.margin.toFixed(1)}%</strong>
              </span>
              <span className="text-gray-600">
                Profit: <strong className="text-green-700">${(h.lineTotals.revenue - h.lineTotals.cost).toFixed(2)}</strong>
              </span>
            </div>
            <span className="font-bold text-blue-600 text-base">${h.lineTotals.revenue.toFixed(2)}</span>
          </div>

          {isBelowMinimum(h.margin, h.marginSettings) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-3 flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Margin ({h.margin.toFixed(1)}%) is below the company minimum of {h.marginSettings.minimumMargin}%.
                Saving will require confirmation.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Charges */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Additional Charges
            </h3>
            <Button variant="outline" size="sm" onClick={() => h.setShowAddCharge(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add Charge
            </Button>
          </div>

          {h.charges.length > 0 ? (
            <div className="space-y-1.5">
              {h.charges.map((charge) => (
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${parseFloat(charge.amount || "0").toFixed(2)}</span>
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0"
                      title={charge.displayToClient !== false ? "Visible to client" : "Hidden from client"}
                      onClick={() => h.toggleChargeDisplayMutation.mutate({
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
                      onClick={() => h.deleteChargeMutation.mutate({ chargeId: charge.id, orderItemId: charge.orderItemId })}
                    >
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-right text-xs text-gray-500 pt-1">
                Total Charges: <strong className="text-gray-800">${h.totalCharges.toFixed(2)}</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No additional charges</p>
          )}
        </CardContent>
      </Card>

      {/* Artwork */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Image className="w-4 h-4 text-gray-400" />
              Artwork {h.artworks.length > 0 && `(${h.artworks.length})`}
            </h3>
            <Button variant="outline" size="sm" onClick={() => h.setPickingArtwork(true)}>
              <Upload className="w-3 h-3 mr-1" />
              Add Artwork
            </Button>
          </div>

          {h.artworks.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {h.artworks.map((art: any) => (
                <div key={art.id} className="border rounded-lg p-2 bg-white w-36 group relative">
                  {art.filePath ? (
                    (() => {
                      const ext = art.filePath.split("?")[0].split(".").pop()?.toLowerCase();
                      const isDesignFile = ["ai", "eps", "psd"].includes(ext || "");
                      const imgSrc = isDesignFile && art.filePath.includes("cloudinary.com")
                        ? getCloudinaryThumbnail(art.filePath, 280, 160)
                        : art.filePath;
                      return (
                        <img
                          src={imgSrc}
                          alt={art.name}
                          className="w-full h-20 object-contain rounded mb-1.5"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement?.insertAdjacentHTML(
                              "afterbegin",
                              `<div class="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-1.5"><span class="text-[10px] text-gray-400 uppercase font-medium">.${ext || "file"}</span></div>`
                            );
                          }}
                        />
                      );
                    })()
                  ) : (
                    <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-1.5">
                      <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <p className="text-[10px] font-medium truncate">{art.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${art.status === "approved" ? "border-green-300 text-green-700" :
                          art.status === "rejected" ? "border-red-300 text-red-700" :
                            "border-yellow-300 text-yellow-700"
                          }`}
                      >
                        {art.status}
                      </Badge>
                      {art.location && <span className="text-[9px] text-gray-400">{art.location}</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        h.deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: itemId });
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No artwork yet — click "Add Artwork" to upload</p>
          )}
        </CardContent>
      </Card>

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-2 pb-8">
        <Button variant="outline" onClick={h.goBack}>Cancel</Button>
        <Button onClick={h.handleSave} disabled={h.isSaving || !h.hasChanges}>
          {h.isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* ADD CHARGE DIALOG */}
      <Dialog open={h.showAddCharge} onOpenChange={(open) => !open && h.setShowAddCharge(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Additional Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description *</Label>
              <Input
                value={h.newCharge.description}
                onChange={(e) => h.setNewCharge(c => ({ ...c, description: e.target.value }))}
                placeholder="e.g., Setup Fee, Rush Charge"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={h.newCharge.chargeType} onValueChange={(v) => h.setNewCharge(c => ({ ...c, chargeType: v }))}>
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
                  value={h.newCharge.amount}
                  onChange={(e) => h.setNewCharge(c => ({ ...c, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ep-vendor-charge" checked={h.newCharge.isVendorCharge} onChange={(e) => h.setNewCharge(c => ({ ...c, isVendorCharge: e.target.checked }))} className="rounded border-gray-300" />
              <Label htmlFor="ep-vendor-charge" className="font-normal text-sm">This is a vendor charge (cost, not revenue)</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ep-display-client" checked={h.newCharge.displayToClient} onChange={(e) => h.setNewCharge(c => ({ ...c, displayToClient: e.target.checked }))} className="rounded border-gray-300" />
              <Label htmlFor="ep-display-client" className="font-normal text-sm">Display to client</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => h.setShowAddCharge(false)}>Cancel</Button>
            <Button
              disabled={!h.newCharge.description || h.newCharge.amount <= 0 || h.addChargeMutation.isPending}
              onClick={() => {
                h.addChargeMutation.mutate({
                  orderItemId: itemId,
                  charge: {
                    description: h.newCharge.description,
                    chargeType: h.newCharge.chargeType,
                    amount: h.newCharge.amount.toFixed(2),
                    isVendorCharge: h.newCharge.isVendorCharge,
                    displayToClient: h.newCharge.displayToClient,
                  },
                }, {
                  onSuccess: () => {
                    h.setShowAddCharge(false);
                    h.setNewCharge({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false, displayToClient: true });
                  },
                });
              }}
            >
              {h.addChargeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ARTWORK FILE PICKER */}
      <FilePickerDialog
        open={h.pickingArtwork}
        onClose={() => h.setPickingArtwork(false)}
        onSelect={h.handleArtworkFilePicked}
        multiple={false}
        contextProjectId={projectId}
        title="Select Artwork File"
      />

      {/* ARTWORK METADATA DIALOG */}
      <Dialog open={!!h.artPickedFile} onOpenChange={(open) => !open && h.resetArtForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {h.artPickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={h.artPickedFile.filePath}
                  alt={h.artPickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{h.artPickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={h.artUploadName} onChange={(e) => h.setArtUploadName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location <span className="text-red-500">*</span></Label>
                <Select value={h.artUploadLocation} onValueChange={h.setArtUploadLocation}>
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
                <Select value={h.artUploadMethod} onValueChange={h.setArtUploadMethod}>
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
                <Input value={h.artUploadSize} onChange={(e) => h.setArtUploadSize(e.target.value)} placeholder='e.g., 3" x 3"' />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input value={h.artUploadColor} onChange={(e) => h.setArtUploadColor(e.target.value)} placeholder="e.g., White, PMS 186" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={h.resetArtForm}>Cancel</Button>
            <Button
              disabled={h.createArtworkMutation.isPending || !h.artPickedFile || !h.artUploadLocation || !h.artUploadMethod}
              onClick={h.handleCreateArtwork}
            >
              {h.createArtworkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARGIN WARNING DIALOG */}
      <AlertDialog open={!!h.marginWarningAction} onOpenChange={(open) => { if (!open) h.dismissMarginWarning(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Below Minimum Margin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  The margin for this product is <strong className="text-red-600">{h.marginWarningValue.toFixed(1)}%</strong>, which is below
                  the company minimum of <strong>{h.marginSettings.minimumMargin}%</strong>.
                </p>
                <p className="mt-2 text-orange-600 font-medium">
                  Are you sure you want to save with this margin?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={h.dismissMarginWarning}>Go Back & Adjust</AlertDialogCancel>
            <AlertDialogAction onClick={h.confirmMarginWarning} className="bg-orange-600 hover:bg-orange-700">
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
