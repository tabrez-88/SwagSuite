import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, ImageIcon, Loader2, Save, ShoppingCart } from "lucide-react";
import type { DocumentEditorProps } from "./types";
import { useDocumentEditor } from "./hooks";

export function DocumentEditor(props: DocumentEditorProps) {
  const {
    previewRef,
    isSaving,
    isClientFacing,
    isSalesOrder,
    isPurchaseOrder,
    fields,
    updateField,
    updateItem,
    handleDownload,
    handleSave,
    dialogTitle,
    doc,
    formatDateDisplay,
  } = useDocumentEditor(props);

  const { onClose, allArtworkItems = {} } = props;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPurchaseOrder ? <ShoppingCart className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            Edit {dialogTitle} - {doc.documentNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Editor Panel */}
          <div className="w-1/2 overflow-y-auto pr-4 border-r space-y-4">
            {/* Document Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Document Information</h3>
              <div className="grid grid-cols-2 gap-3 p-2">
                <div>
                  <Label className="text-xs">Document Title</Label>
                  <Input
                    value={fields.documentTitle}
                    onChange={(e) => updateField('documentTitle', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Document Number</Label>
                  <Input
                    value={fields.documentNumber}
                    onChange={(e) => updateField('documentNumber', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={fields.documentDateRaw}
                    onChange={(e) => {
                      updateField('documentDateRaw', e.target.value);
                      updateField('documentDate', formatDateDisplay(e.target.value));
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {isClientFacing ? 'In-Hands Date' : 'Supplier IHD (Required by)'}
                    {isPurchaseOrder && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    type="date"
                    value={fields.inHandsDateRaw}
                    onChange={(e) => {
                      updateField('inHandsDateRaw', e.target.value);
                      updateField('inHandsDate', formatDateDisplay(e.target.value));
                    }}
                    className={`h-8 text-sm ${isPurchaseOrder && !fields.inHandsDateRaw ? 'border-red-300 focus:ring-red-500' : ''}`}
                    required={isPurchaseOrder}
                  />
                </div>
                {isClientFacing && (
                  <div>
                    <Label className="text-xs">Event Date</Label>
                    <Input
                      type="date"
                      value={fields.eventDateRaw}
                      onChange={(e) => {
                        updateField('eventDateRaw', e.target.value);
                        updateField('eventDate', formatDateDisplay(e.target.value));
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Company Branding */}
            <div className="space-y-3 p-2">
              <h3 className="font-semibold text-sm text-gray-700">Company Branding</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Company Name</Label>
                  <Input
                    value={fields.companyTitle}
                    onChange={(e) => updateField('companyTitle', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tagline</Label>
                  <Input
                    value={fields.companySubtitle}
                    onChange={(e) => updateField('companySubtitle', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Bill To */}
            <div className="space-y-3 p-2">
              <h3 className="font-semibold text-sm text-gray-700">Bill To</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Company/Client Name</Label>
                  <Input
                    value={fields.billToName}
                    onChange={(e) => updateField('billToName', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contact Person</Label>
                  <Input
                    value={fields.billToContact}
                    onChange={(e) => updateField('billToContact', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={fields.billToEmail}
                    onChange={(e) => updateField('billToEmail', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={fields.billToPhone}
                    onChange={(e) => updateField('billToPhone', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Ship To */}
            <div className="space-y-3 p-2">
              <h3 className="font-semibold text-sm text-gray-700">Ship To</h3>
              <Textarea
                value={fields.shipToAddress}
                onChange={(e) => updateField('shipToAddress', e.target.value)}
                placeholder="Shipping address..."
                className="text-sm"
                rows={2}
              />
            </div>

            {isPurchaseOrder && (
              <>
                <Separator />
                {/* Vendor Info (for PO) */}
                <div className="space-y-3 p-2">
                  <h3 className="font-semibold text-sm text-gray-700">Vendor Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Vendor Name</Label>
                      <Input
                        value={fields.vendorName}
                        onChange={(e) => updateField('vendorName', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Vendor Address</Label>
                      <Input
                        value={fields.vendorAddress}
                        onChange={(e) => updateField('vendorAddress', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Vendor Email</Label>
                      <Input
                        value={fields.vendorEmail}
                        onChange={(e) => updateField('vendorEmail', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Line Items */}
            <div className="space-y-3 p-2">
              <h3 className="font-semibold text-sm text-gray-700">Line Items</h3>
              <div className="space-y-2">
                {fields.items.map((item, index) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                    </div>
                    {/* Product Image */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 border rounded bg-white overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Image URL</Label>
                        <Input
                          value={item.imageUrl}
                          onChange={(e) => updateItem(index, 'imageUrl', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="Paste product image URL..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input
                          value={item.color}
                          onChange={(e) => updateItem(index, 'color', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Size</Label>
                        <Input
                          value={item.size}
                          onChange={(e) => updateItem(index, 'size', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium">
                      Total: ${item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-3 p-2">
              <h3 className="font-semibold text-sm text-gray-700">Totals</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Subtotal</Label>
                  <Input
                    value={`$${fields.subtotal.toFixed(2)}`}
                    disabled
                    className="h-8 text-sm bg-gray-100"
                  />
                </div>
                <div>
                  <Label className="text-xs">Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fields.discount}
                    onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tax</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fields.tax}
                    onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="text-right text-lg font-bold">
                Grand Total: ${fields.grandTotal.toFixed(2)}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-3 p-2">
              <h3 className="font-semibold text-sm text-gray-700">Notes & Instructions</h3>
              <div>
                <Label className="text-xs">Special Instructions</Label>
                <Textarea
                  value={fields.specialInstructions}
                  onChange={(e) => updateField('specialInstructions', e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Footer Note</Label>
                <Textarea
                  value={fields.footerNote}
                  onChange={(e) => updateField('footerNote', e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 overflow-auto bg-gray-100 p-4 rounded-lg">
            <div className="text-xs text-gray-500 mb-2 text-center">Live Preview (scroll to see full document)</div>
            <div
              ref={previewRef}
              className="bg-white shadow-lg mx-auto p-8"
              style={{ width: '794px', minHeight: '1123px' }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                  <div>
                    <h1 className={`text-4xl font-bold mb-2 ${isPurchaseOrder ? 'text-green-600' : isSalesOrder ? 'text-emerald-600' : 'text-blue-600'}`}>{fields.documentTitle}</h1>
                    <p className="text-sm text-gray-700">{fields.documentTitle} #{fields.documentNumber}</p>
                    <p className="text-sm text-gray-700">Date: {fields.documentDate}</p>
                    {fields.inHandsDate && (
                      isClientFacing
                        ? <p className="text-sm text-gray-700">In-Hands Date: {fields.inHandsDate}</p>
                        : <p className="text-sm font-bold text-red-600">Required by: {fields.inHandsDate}</p>
                    )}
                    {isClientFacing && fields.eventDate && (
                      <p className="text-sm text-gray-700">Event Date: {fields.eventDate}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold mb-1">{fields.companyTitle}</h2>
                    <p className="text-sm text-gray-600">{fields.companySubtitle}</p>
                  </div>
                </div>

                {/* Bill To / Vendor */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">BILL TO:</h3>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold">{fields.billToName}</p>
                      {fields.billToContact && <p>{fields.billToContact}</p>}
                      {fields.billToEmail && <p>{fields.billToEmail}</p>}
                      {fields.billToPhone && <p>{fields.billToPhone}</p>}
                    </div>
                  </div>
                  {isPurchaseOrder && fields.vendorName && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">VENDOR:</h3>
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold">{fields.vendorName}</p>
                        {fields.vendorAddress && <p>{fields.vendorAddress}</p>}
                        {fields.vendorEmail && <p>{fields.vendorEmail}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ship To */}
                {fields.shipToAddress && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{fields.shipToAddress}</p>
                  </div>
                )}

                {/* Items - CommonSKU style with product images */}
                <div className="mb-6">
                  {fields.items.map((item) => {
                    const itemArtworks = allArtworkItems[item.id] || [];
                    return (
                      <div key={item.id} className="mb-6 pb-4 border-b border-gray-200">
                        {/* Product name as section header */}
                        <h3 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-300">
                          {item.name}
                          {item.sku && <span className="text-xs font-normal text-gray-500 ml-2">SKU: {item.sku}</span>}
                        </h3>

                        {/* Product image + items table side by side */}
                        <div className="flex gap-4">
                          {/* Product image */}
                          {item.imageUrl && (
                            <div style={{ width: "160px", flexShrink: 0 }}>
                              <div style={{ width: "150px", height: "150px" }} className="border rounded bg-white overflow-hidden">
                                <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              </div>
                              <p className="text-[8px] text-gray-400 text-center mt-1 italic">Product image for reference only.</p>
                            </div>
                          )}

                          {/* Items detail table */}
                          <div className="flex-1">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-300">
                                  <th className="text-left py-1 text-xs font-bold text-gray-700">ITEM</th>
                                  <th className="text-center py-1 text-xs font-bold text-gray-700" style={{ width: "60px" }}>QTY</th>
                                  <th className="text-right py-1 text-xs font-bold text-gray-700" style={{ width: "70px" }}>PRICE</th>
                                  <th className="text-right py-1 text-xs font-bold text-gray-700" style={{ width: "80px" }}>AMOUNT</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-gray-100">
                                  <td className="py-1.5 text-xs">
                                    {item.color && item.size ? `Size: ${item.size} - Color: ${item.color}` :
                                     item.color ? `Color: ${item.color}` :
                                     item.size ? `Size: ${item.size}` : item.name}
                                  </td>
                                  <td className="py-1.5 text-xs text-center">{item.quantity}</td>
                                  <td className="py-1.5 text-xs text-right">${item.unitPrice.toFixed(2)}</td>
                                  <td className="py-1.5 text-xs text-right font-medium">${item.total.toFixed(2)}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                  <td className="py-1.5 text-xs font-bold">TOTAL</td>
                                  <td></td>
                                  <td></td>
                                  <td className="py-1.5 text-xs text-right font-bold">${item.total.toFixed(2)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Artwork Details section */}
                        {itemArtworks.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">Artwork Details</h4>
                            {itemArtworks.map((art: any, idx: number) => (
                              <div key={art.id || idx} className="flex gap-4 py-2">
                                {/* Artwork fields */}
                                <div className="flex-1">
                                  <table className="text-xs">
                                    <tbody>
                                      {art.name && (
                                        <tr>
                                          <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN NAME</td>
                                          <td className="py-0.5 text-gray-700">{art.name}</td>
                                        </tr>
                                      )}
                                      {(art.artworkType || art.imprintMethod) && (
                                        <tr>
                                          <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">IMPRINT TYPE</td>
                                          <td className="py-0.5 text-gray-700">{art.artworkType || art.imprintMethod}</td>
                                        </tr>
                                      )}
                                      {art.location && (
                                        <tr>
                                          <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN LOCATION</td>
                                          <td className="py-0.5 text-gray-700">{art.location}</td>
                                        </tr>
                                      )}
                                      {(art.size || art.designSize) && (
                                        <tr>
                                          <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN SIZE</td>
                                          <td className="py-0.5 text-gray-700">{art.size || art.designSize}</td>
                                        </tr>
                                      )}
                                      {(art.color || art.colors) && (
                                        <tr>
                                          <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN COLOR</td>
                                          <td className="py-0.5 text-gray-700">{art.color || art.colors}</td>
                                        </tr>
                                      )}
                                      {art.notes && (
                                        <tr>
                                          <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">NOTES</td>
                                          <td className="py-0.5 text-gray-700">{art.notes}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                {/* Artwork thumbnail */}
                                {(art.filePath || art.fileUrl) && (
                                  <div style={{ width: "120px", flexShrink: 0 }}>
                                    <div style={{ width: "110px", height: "110px" }} className="border rounded bg-white overflow-hidden">
                                      <img src={art.filePath || art.fileUrl} alt={art.name || "Artwork"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64">
                    <div className="flex justify-between py-1 text-sm">
                      <span>Subtotal:</span>
                      <span>${fields.subtotal.toFixed(2)}</span>
                    </div>
                    {fields.discount > 0 && (
                      <div className="flex justify-between py-1 text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-${fields.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {fields.tax > 0 && (
                      <div className="flex justify-between py-1 text-sm">
                        <span>Tax:</span>
                        <span>${fields.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300">
                      <span>Total:</span>
                      <span>${fields.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes / Special Instructions */}
                {(fields.specialInstructions || fields.additionalInformation) && (
                  <div className="mb-6 pt-4 border-t">
                    {fields.specialInstructions && (
                      <>
                        <h3 className="text-sm font-bold text-gray-800 mb-2">
                          {isPurchaseOrder ? 'SPECIAL INSTRUCTIONS:' : 'NOTES:'}
                        </h3>
                        {isPurchaseOrder && fields.inHandsDate && (
                          <p className="text-sm font-bold text-red-600 mb-1">⚠️ RUSH ORDER - Must ship by {fields.inHandsDate}</p>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-line">{fields.specialInstructions}</p>
                      </>
                    )}
                    {isClientFacing && fields.additionalInformation && (
                      <>
                        <h3 className="text-sm font-bold text-gray-800 mb-2 mt-3">ADDITIONAL INFORMATION:</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{fields.additionalInformation}</p>
                      </>
                    )}
                    {isPurchaseOrder && (
                      <p className="text-sm text-gray-700 mt-2">Please confirm receipt of this PO and provide production timeline.</p>
                    )}
                  </div>
                )}

                {/* Footer */}
                {fields.footerNote && (
                  <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>{fields.footerNote}</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
