import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, Truck, CheckCircle2, Calendar, MapPin,
  ExternalLink, AlertCircle, Loader2, Shield,
} from "lucide-react";
import { STATUS_MAP, PROGRESS_STEPS, getTrackingUrl, fmtDate } from "./types";
import { useCustomerPortal } from "./hooks";

export default function CustomerPortalPage() {
  const {
    isLoading,
    error,
    order,
    items,
    shipments,
    statusInfo,
    shippingAddr,
    activeStep,
    isNotFound,
    isExpired,
  } = useCustomerPortal();

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  // ── Error states ──
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {isNotFound ? "Link Not Found" : isExpired ? "Link Expired" : "Something Went Wrong"}
            </h2>
            <p className="text-sm text-gray-500">
              {isNotFound
                ? "This order tracking link doesn't exist. Please check the URL or contact your sales rep."
                : isExpired
                  ? "This tracking link has expired or been deactivated. Please contact your sales rep for a new link."
                  : "We couldn't load your order. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Order {order.orderNumber}</h1>
              <p className="text-xs text-gray-500">
                Placed {fmtDate(order.createdAt)}
                {order.customerPo && <span> &middot; PO: {order.customerPo}</span>}
              </p>
            </div>
          </div>
          <Badge className={`${statusInfo.color} text-sm`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1" /> {statusInfo.label}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Tracker */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {PROGRESS_STEPS.map((step, idx) => {
                const stepInfo = STATUS_MAP[step];
                const isCompleted = idx <= activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center relative">
                    {/* Connector line */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-4 -left-1/2 w-full h-0.5 ${idx <= activeStep ? "bg-blue-500" : "bg-gray-200"}`}
                        style={{ zIndex: 0 }}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : isCompleted
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium ${isCurrent ? "text-blue-700" : isCompleted ? "text-blue-500" : "text-gray-400"}`}>
                      {stepInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Dates */}
        {(order.inHandsDate || order.eventDate) && (
          <div className="grid grid-cols-2 gap-4">
            {order.inHandsDate && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">In-Hands Date</p>
                    <p className="font-semibold">{fmtDate(order.inHandsDate)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {order.eventDate && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Event Date</p>
                    <p className="font-semibold">{fmtDate(order.eventDate)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" /> Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName || "Product"}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {item.productSku && <span>{item.productSku}</span>}
                      {item.color && <span>&middot; {item.color}</span>}
                      {item.size && <span>&middot; {item.size}</span>}
                    </div>
                    {item.imprintMethod && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.imprintMethod} {item.imprintLocation && `@ ${item.imprintLocation}`}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm">
                      <span className="text-gray-500">Qty:</span> <strong>{item.quantity}</strong>
                    </p>
                    <p className="text-sm font-semibold text-blue-700">${parseFloat(item.totalPrice || "0").toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipments */}
        {shipments.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" /> Shipments ({shipments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shipments.map((s) => {
                  const trackUrl = getTrackingUrl(s.carrier, s.trackingNumber);
                  const shipStatus = STATUS_MAP[s.status || ""] || { label: s.status || "Pending", color: "bg-gray-100 text-gray-700" };
                  return (
                    <div key={s.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${shipStatus.color}`}>{shipStatus.label}</Badge>
                          {s.carrier && <span className="text-sm font-medium">{s.carrier}</span>}
                          {s.shippingMethod && <span className="text-xs text-gray-500">{s.shippingMethod}</span>}
                        </div>
                      </div>

                      {s.trackingNumber && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">Tracking:</span>
                          <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{s.trackingNumber}</code>
                          {trackUrl && (
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs font-medium">
                              Track Package <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {s.shipDate && <span>Shipped: {fmtDate(s.shipDate)}</span>}
                        {s.estimatedDelivery && <span>ETA: {fmtDate(s.estimatedDelivery)}</span>}
                        {s.actualDelivery && (
                          <span className="text-green-600 font-medium">Delivered: {fmtDate(s.actualDelivery)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping Address */}
        {shippingAddr && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5">
              {shippingAddr.contactName && <p className="font-medium">{shippingAddr.contactName}</p>}
              {shippingAddr.company && <p>{shippingAddr.company}</p>}
              {shippingAddr.street && <p>{shippingAddr.street}</p>}
              {(shippingAddr.city || shippingAddr.state || shippingAddr.zipCode) && (
                <p>{[shippingAddr.city, shippingAddr.state, shippingAddr.zipCode].filter(Boolean).join(", ")}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Total */}
        <Card className="bg-blue-50/60">
          <CardContent className="p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${parseFloat(order.subtotal || "0").toFixed(2)}</span>
              </div>
              {parseFloat(order.tax || "0") > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${parseFloat(order.tax).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(order.shipping || "0") > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>${parseFloat(order.shipping).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-base text-blue-700">${parseFloat(order.total || "0").toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Notes */}
        {order.customerNotes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{order.customerNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            <span>Secure order tracking powered by SwagSuite</span>
          </div>
        </div>
      </main>
    </div>
  );
}
