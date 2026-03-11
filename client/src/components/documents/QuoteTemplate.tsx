import { forwardRef } from "react";
import { format } from "date-fns";
import { proxyImg } from "@/lib/imageUtils";

interface QuoteTemplateProps {
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
  allArtworkItems?: Record<string, any[]>;
}

const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  ({ order, orderItems, companyName, primaryContact, allArtworkItems = {} }, ref) => {
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

          {/* Items */}
          <div className="mb-6">
            {orderItems.map((item: any) => {
              const unitPrice = parseFloat(item.unitPrice) || 0;
              const quantity = item.quantity || 0;
              const itemTotal = unitPrice * quantity;
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
                          {/* Imprint costs if available */}
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
                          {(art.filePath || art.fileUrl) && (
                            <div style={{ width: "120px", flexShrink: 0 }}>
                              <div style={{ width: "110px", height: "110px" }} className="border rounded bg-white overflow-hidden">
                                <img src={proxyImg(art.filePath || art.fileUrl)} alt={art.name || "Artwork"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
