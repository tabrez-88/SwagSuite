import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Package,
  RefreshCw,
  ShoppingCart,
  Trash2
} from "lucide-react";
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
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import type { DocumentsTabProps } from "./types";
import { useDocumentsTab } from "./hooks";

export function DocumentsTab({
  orderId,
  order,
  orderItems,
  orderVendors,
  companyName,
  primaryContact,
  getEditedItem,
  calculateItemTotals,
  onSendEmail,
  allArtworkItems = {},
}: DocumentsTabProps) {
  const {
    quoteRef,
    poRefs,
    previewDocument,
    setPreviewDocument,
    isGenerating,
    isDeleteDocDialogOpen,
    setIsDeleteDocDialogOpen,
    docToDelete,
    setDocToDelete,
    syncingDocIds,
    documents,
    quoteApprovals,
    createQuoteApprovalMutation,
    deleteDocumentMutation,
    staleDocIds,
    handleAutoGenerate,
    formatFileSize,
    handleEmailClick,
    handleApprovalLinkClick,
    handleDownloadDoc,
    handleDeleteDocClick,
    handleConfirmDelete,
  } = useDocumentsTab({
    orderId,
    order,
    orderItems,
    orderVendors,
    companyName,
    primaryContact,
    getEditedItem,
    onSendEmail,
  });

  return (
    <div className="space-y-6">
      {/* Auto-generate / syncing status */}
      {(isGenerating || syncingDocIds.size > 0) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-900">
              {syncingDocIds.size > 0 ? 'Syncing Documents...' : 'Generating Documents...'}
            </p>
            <p className="text-sm text-blue-700">
              {syncingDocIds.size > 0
                ? 'Updating documents to reflect latest changes'
                : 'Creating Quote and Purchase Orders automatically'}
            </p>
          </div>
        </div>
      )}

      {/* Generated Documents List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Generated Documents
            </CardTitle>
            <CardDescription>
              Documents are auto-generated and synced when order items change
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 && !isGenerating ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              {orderItems.length === 0 ? (
                <>
                  <p>No order items yet</p>
                  <p className="text-sm">Add products to this order to generate documents</p>
                </>
              ) : (
                <>
                  <p>Documents will be generated automatically...</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Now
                  </Button>
                </>
              )}
            </div>
          ) : documents.length === 0 && isGenerating ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 text-blue-400 animate-spin" />
              <p>Generating documents...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => {
                const isStale = staleDocIds.has(doc.id);
                const isProtected = doc.status === 'approved' || doc.status === 'sent';
                const isSyncing = syncingDocIds.has(doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isSyncing ? 'bg-blue-50 border-blue-200' :
                      isStale && isProtected ? 'bg-amber-50 border-amber-200' :
                      'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${
                        isSyncing ? 'bg-blue-100' :
                        doc.documentType === 'quote' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {isSyncing ? (
                          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : doc.documentType === 'quote' ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {doc.documentType === 'quote' ? 'Quote' : 'Purchase Order'} #{doc.documentNumber}
                        </p>
                        {doc.vendorName && (
                          <p className="text-sm text-gray-600">Vendor: {doc.vendorName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                          </span>
                          {doc.fileSize && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              doc.status === 'approved' ? 'border-green-500 text-green-600 bg-green-50' :
                              doc.status === 'sent' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                              doc.status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                              doc.status === 'cancelled' ? 'border-red-500 text-red-600 bg-red-50' :
                              'border-gray-400 text-gray-500'
                            }`}
                          >
                            {doc.status}
                          </Badge>
                          {/* Warning badge for stale protected documents */}
                          {isStale && isProtected && (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-500 text-amber-600 bg-amber-50 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Items changed since {doc.status}
                            </Badge>
                          )}
                          {isSyncing && (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-500 text-blue-600 bg-blue-50"
                            >
                              Syncing...
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Generate Approval Link for Quotes */}
                      {doc.documentType === 'quote' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprovalLinkClick(doc)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          disabled={createQuoteApprovalMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {quoteApprovals.find((a: any) => a.status === 'pending') ? 'Copy Approval Link' : 'Get Approval Link'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailClick(doc)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        {doc.documentType === 'quote' ? 'Email Client' : 'Email Vendor'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDoc(doc)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocClick(doc)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden off-screen quote template for PDF generation */}
      <div ref={quoteRef} style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden' }}>
            <div className="p-8 bg-white" style={{ width: '794px', minHeight: '1123px' }}>
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                <div>
                  <h1 className="text-4xl font-bold text-blue-600 mb-2">QUOTE</h1>
                  <p className="text-sm text-gray-700">Quote #{order?.orderNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-700">Date: {order?.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}</p>
                  {order?.inHandsDate && (
                    <p className="text-sm text-gray-700">In-Hands Date: {format(new Date(order.inHandsDate), 'MMMM dd, yyyy')}</p>
                  )}
                  {(order as any)?.eventDate && (
                    <p className="text-sm text-gray-700">Event Date: {format(new Date((order as any).eventDate), 'MMMM dd, yyyy')}</p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
                  <p className="text-sm text-gray-600">Your Promotional Products Partner</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 mb-2">BILL TO:</h3>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold">{companyName || 'N/A'}</p>
                  {primaryContact && (
                    <p>{primaryContact.firstName} {primaryContact.lastName}</p>
                  )}
                  {primaryContact?.email && <p>{primaryContact.email}</p>}
                  {primaryContact?.phone && <p>{primaryContact.phone}</p>}
                </div>
              </div>

              {(order as any)?.shippingAddress && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
                  <div className="text-sm text-gray-700">
                    {(order as any).shippingContactName && <p className="font-semibold">{(order as any).shippingContactName}</p>}
                    {(order as any).shippingCompanyName && <p>{(order as any).shippingCompanyName}</p>}
                    <p>{(order as any).shippingAddress}</p>
                    {(order as any).shippingAddress2 && <p>{(order as any).shippingAddress2}</p>}
                    <p>{(order as any).shippingCity}, {(order as any).shippingState} {(order as any).shippingZip}</p>
                  </div>
                </div>
              )}

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 text-sm font-bold">Item</th>
                    <th className="text-center py-2 text-sm font-bold">Quantity</th>
                    <th className="text-right py-2 text-sm font-bold">Unit Price</th>
                    <th className="text-right py-2 text-sm font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item: any) => {
                    const editedItem = getEditedItem(item.id, item);
                    const unitPrice = parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                    const quantity = editedItem.quantity || item.quantity || 0;
                    const itemTotal = unitPrice * quantity;

                    return (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2 text-sm">
                          <div className="font-medium">{item.productName}</div>
                          {item.productSku && <div className="text-xs text-gray-500">SKU: {item.productSku}</div>}
                          {(item.color || item.size) && (
                            <div className="text-xs text-gray-500">
                              {item.color && <span>Color: {item.color}</span>}
                              {item.color && item.size && <span> | </span>}
                              {item.size && <span>Size: {item.size}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-center text-sm">{quantity}</td>
                        <td className="py-2 text-right text-sm">${unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right text-sm font-medium">${itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between py-1 text-sm">
                    <span>Subtotal:</span>
                    <span>${orderItems.reduce((sum: number, item: any) => {
                      const editedItem = getEditedItem(item.id, item);
                      const unitPrice = parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                      const quantity = editedItem.quantity || item.quantity || 0;
                      return sum + (unitPrice * quantity);
                    }, 0).toFixed(2)}</span>
                  </div>
                  {order?.shippingCost && parseFloat(order.shippingCost) > 0 && (
                    <div className="flex justify-between py-1 text-sm">
                      <span>Shipping:</span>
                      <span>${parseFloat(order.shippingCost).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300 mt-2">
                    <span>Total:</span>
                    <span>${(() => {
                      const subtotal = orderItems.reduce((sum: number, item: any) => {
                        const editedItem = getEditedItem(item.id, item);
                        const unitPrice = parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                        const quantity = editedItem.quantity || item.quantity || 0;
                        return sum + (unitPrice * quantity);
                      }, 0);
                      const shipping = parseFloat(order?.shippingCost) || 0;
                      return (subtotal + shipping).toFixed(2);
                    })()}</span>
                  </div>
                </div>
              </div>

              {(order?.notes || (order as any)?.additionalInformation) && (
                <div className="mb-6 pt-4 border-t">
                  {order?.notes && (
                    <>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">NOTES:</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{order.notes}</p>
                    </>
                  )}
                  {(order as any)?.additionalInformation && (
                    <>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">ADDITIONAL INFORMATION:</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{(order as any).additionalInformation}</p>
                    </>
                  )}
                </div>
              )}

              <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-1">This quote is valid for 30 days from the date issued.</p>
              </div>
            </div>
          </div>

      {/* Hidden PO templates for PDF generation */}
      {orderVendors.map((vendor: any) => {
        const poNumber = `${order?.orderNumber}-${vendor.id.substring(0, 4).toUpperCase()}`;

        return (
          <Card key={vendor.id} style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden' }}>
            <CardContent>
              <div ref={(el) => { poRefs.current[vendor.id] = el; }}>
                <div className="p-8 bg-white" style={{ width: '794px', minHeight: '1123px' }}>
                  <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                    <div>
                      <h1 className="text-4xl font-bold text-green-600 mb-2">PURCHASE ORDER</h1>
                      <p className="text-sm text-gray-700">PO #{poNumber}</p>
                      <p className="text-sm text-gray-700">Date: {order?.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}</p>
                      {(order as any)?.supplierInHandsDate && (
                        <p className="text-sm font-bold text-red-600">Required by: {format(new Date((order as any).supplierInHandsDate), 'MMMM dd, yyyy')}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
                      <p className="text-sm text-gray-600">Purchaser</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">VENDOR:</h3>
                    <div className="text-sm text-gray-700">
                      <p className="font-bold text-lg">{vendor.name}</p>
                      {vendor.email && <p>Email: {vendor.email}</p>}
                      {vendor.phone && <p>Phone: {vendor.phone}</p>}
                    </div>
                  </div>

                  {(order as any)?.shippingAddress && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
                      <div className="text-sm text-gray-700">
                        {(order as any).shippingContactName && <p className="font-semibold">{(order as any).shippingContactName}</p>}
                        {(order as any).shippingCompanyName && <p>{(order as any).shippingCompanyName}</p>}
                        <p>{(order as any).shippingAddress}</p>
                        {(order as any).shippingAddress2 && <p>{(order as any).shippingAddress2}</p>}
                        <p>{(order as any).shippingCity}, {(order as any).shippingState} {(order as any).shippingZip}</p>
                      </div>
                    </div>
                  )}

                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 text-sm font-bold">Item</th>
                        <th className="text-center py-2 text-sm font-bold">Quantity</th>
                        <th className="text-right py-2 text-sm font-bold">Unit Cost</th>
                        <th className="text-right py-2 text-sm font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.products.map((product: any) => {
                        const item = orderItems.find((i: any) => i.id === product.id);
                        if (!item) return null;
                        const editedItem = getEditedItem(item.id, item);
                        const cost = parseFloat(editedItem.cost) || parseFloat(item.cost) || parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                        const quantity = editedItem.quantity || item.quantity || 0;
                        const itemTotal = cost * quantity;
                        return (
                          <tr key={product.id} className="border-b border-gray-200">
                            <td className="py-2 text-sm">
                              <div className="font-medium">{product.productName}</div>
                              {product.productSku && <div className="text-xs text-gray-500">SKU: {product.productSku}</div>}
                              {(product.color || product.size) && (
                                <div className="text-xs text-gray-500">
                                  {product.color && <span>Color: {product.color}</span>}
                                  {product.color && product.size && <span> | </span>}
                                  {product.size && <span>Size: {product.size}</span>}
                                </div>
                              )}
                            </td>
                            <td className="py-2 text-center text-sm">{quantity}</td>
                            <td className="py-2 text-right text-sm">${cost.toFixed(2)}</td>
                            <td className="py-2 text-right text-sm font-medium">${itemTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="flex justify-end mb-6">
                    <div className="w-64">
                      <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300">
                        <span>Total Cost:</span>
                        <span>${vendor.products.reduce((sum: number, product: any) => {
                          const item = orderItems.find((i: any) => i.id === product.id);
                          if (!item) return sum;
                          const editedItem = getEditedItem(item.id, item);
                          const cost = parseFloat(editedItem.cost) || parseFloat(item.cost) || parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                          const quantity = editedItem.quantity || item.quantity || 0;
                          return sum + (cost * quantity);
                        }, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 pt-4 border-t">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">SPECIAL INSTRUCTIONS:</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      {(order as any)?.supplierInHandsDate && (
                        <p className="font-bold text-red-600">⚠️ RUSH ORDER - Must ship by {format(new Date((order as any).supplierInHandsDate), 'MMMM dd, yyyy')}</p>
                      )}
                      {(order as any)?.supplierNotes && (
                        <p className="whitespace-pre-wrap">{(order as any).supplierNotes}</p>
                      )}
                      {order?.notes && <p className="whitespace-pre-wrap">{order.notes}</p>}
                      <p>Please confirm receipt of this PO and provide production timeline.</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>Please confirm receipt and provide tracking information when shipped.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Document Editor */}
      {previewDocument && (
        <DocumentEditor
          document={previewDocument}
          order={order}
          orderItems={orderItems}
          companyName={companyName}
          primaryContact={primaryContact}
          getEditedItem={getEditedItem}
          onClose={() => setPreviewDocument(null)}
          allArtworkItems={allArtworkItems}
        />
      )}

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={isDeleteDocDialogOpen} onOpenChange={setIsDeleteDocDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document?
              {docToDelete && (
                <span className="block mt-1 font-medium text-foreground">
                  "{docToDelete.documentType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}"
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
