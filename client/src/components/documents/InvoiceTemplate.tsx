import { forwardRef } from "react";
import { format } from "date-fns";
import { proxyImg } from "@/lib/imageUtils";

interface InvoiceTemplateProps {
  invoice: any;
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
  serviceCharges?: any[];
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, order, orderItems, companyName, primaryContact, serviceCharges = [] }, ref) => {
    const subtotal = orderItems.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.totalPrice) || 0);
    }, 0);
    const shipping = parseFloat(order?.shippingCost) || parseFloat(order?.shipping) || 0;
    const tax = parseFloat(invoice?.taxAmount) || parseFloat(order?.tax) || 0;
    const clientServiceCharges = serviceCharges.filter((c: any) => c.displayToClient !== false);
    const serviceChargesTotal = clientServiceCharges.reduce((sum: number, c: any) => {
      return sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0");
    }, 0);
    const grossSubtotal = subtotal + serviceChargesTotal;
    const total = parseFloat(invoice?.totalAmount) || (grossSubtotal + shipping + tax);

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
              <h1 className="text-4xl font-bold text-purple-600 mb-2">INVOICE</h1>
              <p className="text-sm text-gray-700">Invoice #{invoice?.invoiceNumber || "N/A"}</p>
              <p className="text-sm text-gray-700">Order #{order?.orderNumber || "N/A"}</p>
              <p className="text-sm text-gray-700">
                Date: {invoice?.createdAt ? format(new Date(invoice.createdAt), "MMMM dd, yyyy") : "N/A"}
              </p>
              {invoice?.dueDate && (
                <p className="text-sm font-semibold text-gray-900">
                  Due Date: {format(new Date(invoice.dueDate), "MMMM dd, yyyy")}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
              <p className="text-sm text-gray-600">Your Promotional Products Partner</p>
              {invoice?.status === "overdue" && (
                <div className="mt-2 inline-flex items-center justify-center px-4 py-1.5 bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider rounded">
                  PAST DUE
                </div>
              )}
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bill To</h3>
              <p className="font-semibold text-gray-900">{companyName || "N/A"}</p>
              {primaryContact && (
                <p className="text-sm text-gray-700">
                  {primaryContact.firstName} {primaryContact.lastName}
                </p>
              )}
              {primaryContact?.email && (
                <p className="text-sm text-gray-700">{primaryContact.email}</p>
              )}
              {billingAddr && (
                <div className="text-sm text-gray-700">
                  {billingAddr.street && <p>{billingAddr.street}</p>}
                  {(billingAddr.city || billingAddr.state || billingAddr.zip) && (
                    <p>{[billingAddr.city, billingAddr.state].filter(Boolean).join(", ")} {billingAddr.zip}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Ship To</h3>
              {shippingAddr ? (
                <div className="text-sm text-gray-700">
                  {shippingAddr.name && <p className="font-semibold text-gray-900">{shippingAddr.name}</p>}
                  {shippingAddr.street && <p>{shippingAddr.street}</p>}
                  {(shippingAddr.city || shippingAddr.state || shippingAddr.zip) && (
                    <p>{[shippingAddr.city, shippingAddr.state].filter(Boolean).join(", ")} {shippingAddr.zip}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Same as billing</p>
              )}
            </div>
          </div>

          {/* Payment Terms */}
          <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Payment Terms:</span>
                <span className="ml-2 font-medium">
                  {order?.paymentTerms
                    ? order.paymentTerms.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
                    : "Net 30"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 font-medium ${invoice?.status === "paid" ? "text-green-600" : invoice?.status === "overdue" ? "text-red-600" : "text-yellow-600"}`}>
                  {(invoice?.status || "pending").charAt(0).toUpperCase() + (invoice?.status || "pending").slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Amount Due:</span>
                <span className="ml-2 font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="text-left p-2 text-xs font-semibold" style={{ width: "40%" }}>Item</th>
                <th className="text-center p-2 text-xs font-semibold">Qty</th>
                <th className="text-right p-2 text-xs font-semibold">Unit Price</th>
                <th className="text-right p-2 text-xs font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item: any, idx: number) => {
                const product = item.product || {};
                const imageUrl = product.imageUrl || item.imageUrl;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-2 border-b border-gray-200">
                      <div className="flex items-start gap-2">
                        {imageUrl && (
                          <img
                            src={proxyImg(imageUrl)}
                            alt=""
                            className="w-10 h-10 object-contain rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.name || item.productName || item.name || "Product"}
                          </p>
                          {(product.sku || item.sku) && (
                            <p className="text-xs text-gray-500">SKU: {product.sku || item.sku}</p>
                          )}
                          {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                          {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center text-sm border-b border-gray-200">{item.quantity}</td>
                    <td className="p-2 text-right text-sm border-b border-gray-200">
                      ${parseFloat(item.unitPrice || "0").toFixed(2)}
                    </td>
                    <td className="p-2 text-right text-sm font-medium border-b border-gray-200">
                      ${parseFloat(item.totalPrice || "0").toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Service Charges */}
          {clientServiceCharges.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Services & Fees</h3>
              <table className="w-full border-collapse">
                <tbody>
                  {clientServiceCharges.map((charge: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-1 text-sm text-gray-700">{charge.description || charge.chargeType}</td>
                      <td className="py-1 text-center text-sm">{charge.quantity || 1}</td>
                      <td className="py-1 text-right text-sm">${parseFloat(charge.unitPrice || "0").toFixed(2)}</td>
                      <td className="py-1 text-right text-sm font-medium">
                        ${((charge.quantity || 1) * parseFloat(charge.unitPrice || "0")).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>${grossSubtotal.toFixed(2)}</span>
              </div>
              {shipping > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300 mt-2">
                <span>Total Due:</span>
                <span className="text-purple-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order?.notes && (
            <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 text-center">
            <p className="text-xs text-gray-500">
              Thank you for your business! Please remit payment by the due date shown above.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Generated by SwagSuite
            </p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";
export default InvoiceTemplate;
