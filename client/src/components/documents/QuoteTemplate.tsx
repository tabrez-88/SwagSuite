import { forwardRef } from "react";
import { format } from "date-fns";

interface QuoteTemplateProps {
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
}

const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  ({ order, orderItems, companyName, primaryContact }, ref) => {
    const subtotal = orderItems.reduce((sum: number, item: any) => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const quantity = item.quantity || 0;
      return sum + unitPrice * quantity;
    }, 0);
    const shipping = parseFloat(order?.shippingCost) || 0;
    const total = subtotal + shipping;

    return (
      <div ref={ref} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
        <div className="p-8 bg-white" style={{ width: "794px", minHeight: "1123px" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
            <div>
              <h1 className="text-4xl font-bold text-blue-600 mb-2">QUOTE</h1>
              <p className="text-sm text-gray-700">Quote #{order?.orderNumber || "N/A"}</p>
              <p className="text-sm text-gray-700">
                Date: {order?.createdAt ? format(new Date(order.createdAt), "MMMM dd, yyyy") : "N/A"}
              </p>
              {order?.inHandsDate && (
                <p className="text-sm text-gray-700">In-Hands Date: {format(new Date(order.inHandsDate), "MMMM dd, yyyy")}</p>
              )}
              {order?.eventDate && (
                <p className="text-sm text-gray-700">Event Date: {format(new Date(order.eventDate), "MMMM dd, yyyy")}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
              <p className="text-sm text-gray-600">Your Promotional Products Partner</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2">BILL TO:</h3>
            <div className="text-sm text-gray-700">
              <p className="font-semibold">{companyName || "N/A"}</p>
              {primaryContact && (
                <p>{primaryContact.firstName} {primaryContact.lastName}</p>
              )}
              {primaryContact?.email && <p>{primaryContact.email}</p>}
              {primaryContact?.phone && <p>{primaryContact.phone}</p>}
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
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300 mt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order?.notes || order?.additionalInformation) && (
            <div className="mb-6 pt-4 border-t">
              {order?.notes && (
                <>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">NOTES:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{order.notes}</p>
                </>
              )}
              {order?.additionalInformation && (
                <>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">ADDITIONAL INFORMATION:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.additionalInformation}</p>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">This quote is valid for 30 days from the date issued.</p>
          </div>
        </div>
      </div>
    );
  }
);

QuoteTemplate.displayName = "QuoteTemplate";
export default QuoteTemplate;
