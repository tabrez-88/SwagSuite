import { forwardRef } from "react";
import { format } from "date-fns";

interface PurchaseOrderTemplateProps {
  order: any;
  vendor: any;
  vendorItems: any[];
  poNumber: string;
}

const PurchaseOrderTemplate = forwardRef<HTMLDivElement, PurchaseOrderTemplateProps>(
  ({ order, vendor, vendorItems, poNumber }, ref) => {
    const totalCost = vendorItems.reduce((sum: number, item: any) => {
      const cost = parseFloat(item.cost) || parseFloat(item.unitPrice) || 0;
      const quantity = item.quantity || 0;
      return sum + cost * quantity;
    }, 0);

    return (
      <div ref={ref} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
        <div className="p-8 bg-white" style={{ width: "794px", minHeight: "1123px" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
            <div>
              <h1 className="text-4xl font-bold text-green-600 mb-2">PURCHASE ORDER</h1>
              <p className="text-sm text-gray-700">PO #{poNumber}</p>
              <p className="text-sm text-gray-700">
                Date: {order?.createdAt ? format(new Date(order.createdAt), "MMMM dd, yyyy") : "N/A"}
              </p>
              {order?.supplierInHandsDate && (
                <p className="text-sm font-bold text-red-600">
                  Required by: {format(new Date(order.supplierInHandsDate), "MMMM dd, yyyy")}
                </p>
              )}
              {order?.isFirm && (
                <p className="text-sm font-bold text-blue-700">FIRM ORDER — Date cannot be adjusted</p>
              )}
              {order?.isRush && !order?.supplierInHandsDate && (
                <p className="text-sm font-bold text-red-600">RUSH ORDER — Please prioritize</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
              <p className="text-sm text-gray-600">Purchaser</p>
            </div>
          </div>

          {/* Vendor */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2">VENDOR:</h3>
            <div className="text-sm text-gray-700">
              <p className="font-bold text-lg">{vendor.name}</p>
              {vendor.email && <p>Email: {vendor.email}</p>}
              {vendor.phone && <p>Phone: {vendor.phone}</p>}
            </div>
          </div>

          {/* Ship To */}
          {order?.shippingAddress && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
              <div className="text-sm text-gray-700">
                {order.shippingContactName && <p className="font-semibold">{order.shippingContactName}</p>}
                {order.shippingCompanyName && <p>{order.shippingCompanyName}</p>}
                <p>{order.shippingAddress}</p>
                {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
                <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
              </div>
            </div>
          )}

          {/* Items Table */}
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
              {vendorItems.map((item: any) => {
                const cost = parseFloat(item.cost) || parseFloat(item.unitPrice) || 0;
                const quantity = item.quantity || 0;
                const itemTotal = cost * quantity;
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
                    <td className="py-2 text-right text-sm">${cost.toFixed(2)}</td>
                    <td className="py-2 text-right text-sm font-medium">${itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300">
                <span>Total Cost:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-6 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-800 mb-2">SPECIAL INSTRUCTIONS:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              {order?.supplierInHandsDate && (
                <p className="font-bold text-red-600">
                  ⚠️ RUSH ORDER - Must ship by {format(new Date(order.supplierInHandsDate), "MMMM dd, yyyy")}
                </p>
              )}
              {order?.isFirm && (
                <p className="font-bold text-blue-700">
                  📌 FIRM ORDER — Delivery date is locked and cannot be adjusted.
                </p>
              )}
              {order?.isRush && !order?.supplierInHandsDate && (
                <p className="font-bold text-red-600">
                  ⚡ RUSH ORDER — Please prioritize this order.
                </p>
              )}
              {order?.supplierNotes && <p className="whitespace-pre-wrap">{order.supplierNotes}</p>}
              {order?.notes && <p className="whitespace-pre-wrap">{order.notes}</p>}
              <p>Please confirm receipt of this PO and provide production timeline.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
            <p>Please confirm receipt and provide tracking information when shipped.</p>
          </div>
        </div>
      </div>
    );
  }
);

PurchaseOrderTemplate.displayName = "PurchaseOrderTemplate";
export default PurchaseOrderTemplate;
