import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  AlertTriangle,
  FileText,
  Loader2,
  ExternalLink,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { usePoConfirmation } from "./hooks";

export default function POConfirmationPage() {
  const {
    data,
    isLoading,
    error,
    showDeclineForm,
    declineReason,
    setDeclineReason,
    confirmNotes,
    setConfirmNotes,
    confirmMutation,
    declineMutation,
    handleConfirm,
    handleDecline,
    handleShowDeclineForm,
    handleHideDeclineForm,
  } = usePoConfirmation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Not Found</h2>
            <p className="text-gray-500">This purchase order confirmation link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = data.status === "pending";
  const isConfirmed = data.status === "confirmed";
  const isDeclined = data.status === "declined";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${isConfirmed ? "from-green-600 to-green-700" : isDeclined ? "from-red-600 to-red-700" : "from-blue-600 to-blue-700"} text-white py-8`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Purchase Order Confirmation</h1>
          </div>
          <p className="text-white/80">
            PO #{data.document_number || "N/A"} — Order #{data.order_number || "N/A"}
          </p>
          {data.company_name && (
            <p className="text-white/70 text-sm mt-1">Client: {data.company_name}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        {isConfirmed && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">PO Confirmed</p>
                <p className="text-sm text-green-700">
                  Confirmed on {data.confirmed_at ? format(new Date(data.confirmed_at), "MMM dd, yyyy 'at' h:mm a") : "N/A"}
                </p>
                {data.confirmation_notes && (
                  <p className="text-sm text-green-700 mt-1">Notes: {data.confirmation_notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {isDeclined && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">PO Declined</p>
                <p className="text-sm text-red-700">
                  Declined on {data.declined_at ? format(new Date(data.declined_at), "MMM dd, yyyy 'at' h:mm a") : "N/A"}
                </p>
                {data.decline_reason && (
                  <p className="text-sm text-red-700 mt-1">Reason: {data.decline_reason}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Key Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.supplier_in_hands_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier In-Hands Date:</span>
                  <span className="font-medium">{format(new Date(data.supplier_in_hands_date), "MMM dd, yyyy")}</span>
                </div>
              )}
              {data.in_hands_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer In-Hands Date:</span>
                  <span className="font-medium">{format(new Date(data.in_hands_date), "MMM dd, yyyy")}</span>
                </div>
              )}
              {data.event_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Date:</span>
                  <span className="font-medium">{format(new Date(data.event_date), "MMM dd, yyyy")}</span>
                </div>
              )}
              {data.is_firm && (
                <Badge className="bg-blue-100 text-blue-800 border-0">FIRM - Date Cannot Be Adjusted</Badge>
              )}
              {data.is_rush && (
                <Badge className="bg-red-100 text-red-800 border-0">RUSH ORDER</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" /> Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.shipping_method && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium">{data.shipping_method}</span>
                </div>
              )}
              {data.shipping_address && (
                <div>
                  <span className="text-gray-600">Ship To:</span>
                  <p className="font-medium mt-1 whitespace-pre-line">{data.shipping_address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supplier Notes */}
        {data.supplier_notes && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.supplier_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* PDF Preview */}
        {data.pdf_url && (
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Purchase Order Document
                </CardTitle>
                <a href={data.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="w-3 h-3" /> Open PDF
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(data.pdf_url)}&embedded=true&t=${Date.now()}`}
                className="w-full border rounded"
                style={{ height: "500px" }}
                title="PO Preview"
              />
            </CardContent>
          </Card>
        )}

        {/* Items */}
        {data.items && data.items.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items ({data.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    {item.product_image && (
                      <img src={item.product_image} alt="" className="w-16 h-16 object-contain rounded border bg-white" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      {item.product_sku && <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>}
                      <div className="flex gap-4 mt-1 text-xs text-gray-600">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                      {item.imprint_method && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.imprint_method} {item.imprint_location ? `@ ${item.imprint_location}` : ""}
                        </p>
                      )}
                      {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Card */}
        {isPending && (
          <Card className="border-blue-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Confirm or Decline this Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDeclineForm ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Notes (optional)</label>
                    <Textarea
                      value={confirmNotes}
                      onChange={(e) => setConfirmNotes(e.target.value)}
                      placeholder="Add any notes about lead times, availability, etc."
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConfirm}
                      disabled={confirmMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    >
                      {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirm PO
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShowDeclineForm}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Reason for declining *</label>
                    <Textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Please explain why you cannot fulfill this order..."
                      className="min-h-[100px] text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleHideDeclineForm}
                    >
                      Back
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDecline}
                      disabled={declineMutation.isPending || !declineReason.trim()}
                      className="gap-2"
                    >
                      {declineMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Decline PO
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>Powered by SwagSuite</p>
        </div>
      </div>
    </div>
  );
}
