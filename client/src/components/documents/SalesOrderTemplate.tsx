import { forwardRef } from "react";
import { format } from "date-fns";

interface SalesOrderTemplateProps {
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
}

const SalesOrderTemplate = forwardRef<HTMLDivElement, SalesOrderTemplateProps>(
  ({ order, orderItems, companyName, primaryContact }, ref) => {
    const subtotal = orderItems.reduce((sum: number, item: any) => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const quantity = item.quantity || 0;
      return sum + unitPrice * quantity;
    }, 0);
    const shipping = parseFloat(order?.shippingCost) || 0;
    const tax = parseFloat(order?.tax) || 0;
    const total = subtotal + shipping + tax;

    const billingAddr = (() => {
      try {
        return order?.billingAddress ? JSON.parse(order.billingAddress) : null;
      } catch {
        return null;
      }
    })();

    const shippingAddr = (() => {
      try {
        return order?.shippingAddress ? JSON.parse(order.shippingAddress) : null;
      } catch {
        return null;
      }
    })();

    return (
      <div ref={ref} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
        <div className="p-8 bg-white" style={{ width: "794px", minHeight: "1123px" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
            <div>
              <h1 className="text-4xl font-bold text-emerald-600 mb-2">SALES ORDER</h1>
              <p className="text-sm text-gray-700">SO #{order?.orderNumber || "N/A"}</p>
              <p className="text-sm text-gray-700">
                Date: {order?.createdAt ? format(new Date(order.createdAt), "MMMM dd, yyyy") : "N/A"}
              </p>
              {order?.inHandsDate && (
                <p className="text-sm text-gray-700">In-Hands Date: {format(new Date(order.inHandsDate), "MMMM dd, yyyy")}</p>
              )}
              {order?.eventDate && (
                <p className="text-sm text-gray-700">Event Date: {format(new Date(order.eventDate), "MMMM dd, yyyy")}</p>
              )}
              {order?.customerPo && (
                <p className="text-sm text-gray-700">Customer PO: {order.customerPo}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
              <p className="text-sm text-gray-600">Your Promotional Products Partner</p>
              {order?.isFirm && (
                <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  FIRM ORDER
                </div>
              )}
              {order?.isRush && (
                <div className="mt-1 inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                  RUSH ORDER
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">BILL TO:</h3>
              <div className="text-sm text-gray-700">
                <p className="font-semibold">{companyName || "N/A"}</p>
                {billingAddr?.contactName && <p>{billingAddr.contactName}</p>}
                {!billingAddr?.contactName && primaryContact && (
                  <p>{primaryContact.firstName} {primaryContact.lastName}</p>
                )}
                {billingAddr?.street && <p>{billingAddr.street}</p>}
                {billingAddr && (
                  <p>{[billingAddr.city, billingAddr.state, billingAddr.zipCode].filter(Boolean).join(", ")}</p>
                )}
                {(billingAddr?.email || primaryContact?.email) && (
                  <p>{billingAddr?.email || primaryContact?.email}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
              <div className="text-sm text-gray-700">
                {shippingAddr ? (
                  <>
                    {shippingAddr.contactName && <p className="font-semibold">{shippingAddr.contactName}</p>}
                    <p>{companyName}</p>
                    {(shippingAddr.street || shippingAddr.address) && <p>{shippingAddr.street || shippingAddr.address}</p>}
                    <p>{[shippingAddr.city, shippingAddr.state, shippingAddr.zipCode].filter(Boolean).join(", ")}</p>
                  </>
                ) : (
                  <p className="text-gray-400">Not specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {order?.paymentTerms && (
            <div className="mb-4 text-sm">
              <span className="font-bold text-gray-800">Payment Terms: </span>
              <span className="text-gray-700">{order.paymentTerms.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
            </div>
          )}

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 text-sm font-bold">Item</th>
                <th className="text-left py-2 text-sm font-bold">Decoration</th>
                <th className="text-center py-2 text-sm font-bold">Qty</th>
                <th className="text-right py-2 text-sm font-bold">Unit Price</th>
                <th className="text-right py-2 text-sm font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item: any) => {
                const unitPrice = parseFloat(item.unitPrice) || 0;
                const quantity = item.quantity || 0;
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
                    <td className="py-2 text-sm text-gray-600">
                      {item.imprintMethod && <div className="text-xs">{item.imprintMethod}</div>}
                      {item.imprintLocation && <div className="text-xs text-gray-400">{item.imprintLocation}</div>}
                    </td>
                    <td className="py-2 text-center text-sm">{quantity}</td>
                    <td className="py-2 text-right text-sm">${unitPrice.toFixed(2)}</td>
                    <td className="py-2 text-right text-sm font-medium">${itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1 text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {shipping > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span>Shipping:</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300 mt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order?.notes && (
            <div className="mb-6 pt-4 border-t">
              <h3 className="text-sm font-bold text-gray-800 mb-2">NOTES:</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">This sales order confirms the agreed-upon terms for the products listed above.</p>
          </div>
        </div>
      </div>
    );
  }
);

SalesOrderTemplate.displayName = "SalesOrderTemplate";
export default SalesOrderTemplate;
