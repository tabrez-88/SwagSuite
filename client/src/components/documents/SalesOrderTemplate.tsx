import { forwardRef } from "react";
import { format } from "date-fns";
import { proxyImg } from "@/lib/imageUtils";
import { getRenderableImageUrl } from "@/lib/media-library";

interface SalesOrderTemplateProps {
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
  allArtworkItems?: Record<string, any[]>;
  serviceCharges?: any[];
  assignedUser?: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string } | null;
}

const SalesOrderTemplate = forwardRef<HTMLDivElement, SalesOrderTemplateProps>(
  ({ order, orderItems, companyName, primaryContact, allArtworkItems = {}, serviceCharges = [], assignedUser }, ref) => {
    const subtotal = orderItems.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.totalPrice) || 0);
    }, 0);
    const shipping = parseFloat(order?.shippingCost) || parseFloat(order?.shipping) || 0;
    const tax = parseFloat(order?.tax) || 0;
    const clientServiceCharges = serviceCharges.filter((c: any) => c.displayToClient !== false);
    const serviceChargesTotal = clientServiceCharges.reduce((sum: number, c: any) => {
      return sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0");
    }, 0);
    const grossSubtotal = subtotal + serviceChargesTotal;
    // Discount disabled for now — kept in schema
    const total = grossSubtotal + shipping + tax;

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
                <div className="mt-2 inline-flex items-center justify-center px-4 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider rounded">
                  FIRM ORDER
                </div>
              )}
              {order?.isRush && (
                <div className="mt-1 inline-flex items-center justify-center px-4 py-1.5 bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider rounded">
                  RUSH ORDER
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">BILLING ADDRESS:</h3>
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
                {(billingAddr?.phone || primaryContact?.phone) && (
                  <p>{billingAddr?.phone || primaryContact?.phone}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">SHIPPING ADDRESS:</h3>
              <div className="text-sm text-gray-700">
                {shippingAddr ? (
                  <>
                    <p className="font-semibold">{companyName}</p>
                    {shippingAddr.contactName && <p>{shippingAddr.contactName}</p>}
                    {(shippingAddr.street || shippingAddr.address) && <p>{shippingAddr.street || shippingAddr.address}</p>}
                    <p>{[shippingAddr.city, shippingAddr.state, shippingAddr.zipCode].filter(Boolean).join(", ")}</p>
                    {shippingAddr.email && <p>{shippingAddr.email}</p>}
                    {shippingAddr.phone && <p>{shippingAddr.phone}</p>}
                  </>
                ) : (
                  <p className="text-gray-400">Not specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Terms & Sales Rep */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {order?.paymentTerms && (
                <div className="text-sm">
                  <span className="font-bold text-gray-800">Payment Terms: </span>
                  <span className="text-gray-700">{order.paymentTerms.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                </div>
              )}
            </div>
            {assignedUser && (
              <div className="flex items-center gap-2">
                {assignedUser.profileImageUrl && (
                  <img
                    src={proxyImg(assignedUser.profileImageUrl)}
                    alt=""
                    style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                  />
                )}
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-800">Your Sales Rep</p>
                  <p className="text-xs text-gray-700">
                    {[assignedUser.firstName, assignedUser.lastName].filter(Boolean).join(" ")}
                  </p>
                  {assignedUser.email && (
                    <p className="text-[10px] text-gray-500">{assignedUser.email}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-6">
            {orderItems.map((item: any) => {
              const unitPrice = parseFloat(item.unitPrice) || 0;
              const quantity = item.quantity || 0;
              const itemTotal = parseFloat(item.totalPrice) || (unitPrice * quantity);
              const itemArtworks = allArtworkItems[item.id] || [];

              return (
                <div key={item.id} className="mb-6 pb-4 border-b border-gray-200">
                  {/* Product name as section header */}
                  <h3 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-300">
                    {item.productName}
                    {item.productSku && <span className="text-xs font-normal text-gray-500 ml-2">SKU: {item.productSku}</span>}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                  )}

                  {/* Product image + items table side by side */}
                  <div className="flex gap-4">
                    {/* Product image - large like CommonSKU */}
                    {(item.imageUrl || item.productImageUrl) && (
                      <div style={{ width: "160px", flexShrink: 0 }}>
                        <div style={{ width: "150px", height: "150px" }} className="border rounded bg-white overflow-hidden">
                          <img src={proxyImg(item.imageUrl || item.productImageUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
                               item.size ? `Size: ${item.size}` : item.productName}
                            </td>
                            <td className="py-1.5 text-xs text-center">{quantity}</td>
                            <td className="py-1.5 text-xs text-right">${unitPrice.toFixed(2)}</td>
                            <td className="py-1.5 text-xs text-right font-medium">${itemTotal.toFixed(2)}</td>
                          </tr>
                          {/* Imprint info row */}
                          {item.imprintMethod && item.imprintLocation && (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5 text-xs text-gray-600">
                                Imprint Cost - {item.imprintLocation}
                              </td>
                              <td className="py-1.5 text-xs text-center">{quantity}</td>
                              <td className="py-1.5 text-xs text-right">—</td>
                              <td className="py-1.5 text-xs text-right">—</td>
                            </tr>
                          )}
                          <tr className="border-t border-gray-300">
                            <td className="py-1.5 text-xs font-bold">TOTAL</td>
                            <td></td>
                            <td></td>
                            <td className="py-1.5 text-xs text-right font-bold">${itemTotal.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Artwork Details section - CommonSKU style */}
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
                          {/* Artwork thumbnail - larger */}
                          {(() => {
                            const artUrl = art.filePath || art.fileUrl;
                            const renderUrl = getRenderableImageUrl(artUrl);
                            if (!artUrl) return null;
                            return (
                              <div style={{ width: "120px", flexShrink: 0 }}>
                                <div style={{ width: "110px", height: "110px" }} className="border rounded bg-white overflow-hidden flex items-center justify-center">
                                  {renderUrl ? (
                                    <img src={proxyImg(renderUrl)} alt={art.name || "Artwork"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                  ) : (
                                    <div className="text-center p-2">
                                      <div style={{ fontSize: "24px" }}>📎</div>
                                      <p style={{ fontSize: "7px" }} className="text-gray-500 mt-1 break-all">{artUrl.split('/').pop()?.split('?')[0] || art.name}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Service Charges */}
          {clientServiceCharges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2 pb-1 border-b border-gray-300">Services & Fees</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 text-xs font-bold text-gray-700">SERVICE</th>
                    <th className="text-center py-1 text-xs font-bold text-gray-700" style={{ width: "60px" }}>QTY</th>
                    <th className="text-right py-1 text-xs font-bold text-gray-700" style={{ width: "70px" }}>PRICE</th>
                    <th className="text-right py-1 text-xs font-bold text-gray-700" style={{ width: "80px" }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {clientServiceCharges.map((charge: any) => {
                    const qty = charge.quantity || 1;
                    const price = parseFloat(charge.unitPrice || "0");
                    return (
                      <tr key={charge.id} className="border-b border-gray-100">
                        <td className="py-1.5 text-xs">{charge.description}</td>
                        <td className="py-1.5 text-xs text-center">{qty}</td>
                        <td className="py-1.5 text-xs text-right">${price.toFixed(2)}</td>
                        <td className="py-1.5 text-xs text-right font-medium">${(qty * price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1 text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {serviceChargesTotal > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span>Services & Fees:</span>
                  <span>${serviceChargesTotal.toFixed(2)}</span>
                </div>
              )}
              {/* Discount hidden — feature not yet finalized */}
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
