import { forwardRef } from "react";
import { format } from "date-fns";
import { proxyImg } from "@/lib/imageUtils";

interface PurchaseOrderTemplateProps {
  order: any;
  vendor: any;
  vendorItems: any[];
  poNumber: string;
  artworkItems?: any[];
  vendorIHD?: string | null; // Per-vendor Supplier IHD (yyyy-MM-dd), falls back to order.supplierInHandsDate
}

const PurchaseOrderTemplate = forwardRef<HTMLDivElement, PurchaseOrderTemplateProps>(
  ({ order, vendor, vendorItems, poNumber, artworkItems = [], vendorIHD }, ref) => {
    // Effective supplier IHD: vendor-specific → order-level fallback
    const effectiveIHD = vendorIHD || order?.supplierInHandsDate;
    const shippingAddr = (() => {
      try {
        return order?.shippingAddress ? JSON.parse(order.shippingAddress) : null;
      } catch { return null; }
    })();

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
              {effectiveIHD && (
                <p className="text-sm font-bold text-red-600">
                  Required by: {format(new Date(effectiveIHD), "MMMM dd, yyyy")}
                </p>
              )}
              {order?.isFirm && (
                <p className="text-sm font-bold text-blue-700">FIRM ORDER — Date cannot be adjusted</p>
              )}
              {order?.isRush && !effectiveIHD && (
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

          {/* Shipping Address */}
          {shippingAddr && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">SHIPPING ADDRESS:</h3>
              <div className="text-sm text-gray-700">
                {shippingAddr.contactName && <p className="font-semibold">{shippingAddr.contactName}</p>}
                {(shippingAddr.street || shippingAddr.address) && <p>{shippingAddr.street || shippingAddr.address}</p>}
                <p>{[shippingAddr.city, shippingAddr.state, shippingAddr.zipCode].filter(Boolean).join(", ")}</p>
                {shippingAddr.email && <p>{shippingAddr.email}</p>}
                {shippingAddr.phone && <p>{shippingAddr.phone}</p>}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="mb-6">
            {vendorItems.map((item: any) => {
              const cost = parseFloat(item.cost) || parseFloat(item.unitPrice) || 0;
              const quantity = item.quantity || 0;
              const itemTotal = cost * quantity;
              // Find artwork items for this specific order item
              const itemArtworks = artworkItems.filter((art: any) => art.orderItemId === item.id);

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
                            <th className="text-right py-1 text-xs font-bold text-gray-700" style={{ width: "70px" }}>COST</th>
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
                            <td className="py-1.5 text-xs text-right">${cost.toFixed(2)}</td>
                            <td className="py-1.5 text-xs text-right font-medium">${itemTotal.toFixed(2)}</td>
                          </tr>
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

                  {/* Artwork Details section per item - CommonSKU style */}
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
                                {art.proofFilePath && (
                                  <tr>
                                    <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">PROOF STATUS</td>
                                    <td className="py-0.5 text-gray-700">
                                      {art.status === "approved" || art.status === "proofing_complete" ? "Approved" : art.status === "proof_received" ? "Received" : "Pending"}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {/* Artwork thumbnail - larger */}
                          <div style={{ width: "120px", flexShrink: 0 }} className="flex flex-col gap-2">
                            {(art.filePath || art.fileUrl) && (
                              <div style={{ width: "110px", height: "110px" }} className="border rounded bg-white overflow-hidden">
                                <img src={proxyImg(art.filePath || art.fileUrl)} alt={art.name || "Artwork"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              </div>
                            )}
                            {/* Proof thumbnail if different */}
                            {art.proofFilePath && art.proofFilePath !== art.filePath && (
                              <div>
                                <p className="text-[8px] text-gray-500 mb-0.5">Vendor Proof:</p>
                                <div style={{ width: "80px", height: "80px" }} className="border rounded bg-white overflow-hidden">
                                  <img src={proxyImg(art.proofFilePath)} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Total */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300">
                <span>Total Cost:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Artwork items not linked to a specific product */}
          {artworkItems.filter((art: any) => !vendorItems.some((vi: any) => vi.id === art.orderItemId)).length > 0 && (
            <div className="mb-6 pt-4 border-t">
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-1 border-b border-gray-300">Additional Artwork & Decoration</h3>
              {artworkItems.filter((art: any) => !vendorItems.some((vi: any) => vi.id === art.orderItemId)).map((art: any, idx: number) => (
                <div key={art.id || idx} className="flex gap-4 py-2">
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
                        {(art.color || art.colors) && (
                          <tr>
                            <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN COLOR</td>
                            <td className="py-0.5 text-gray-700">{art.color || art.colors}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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

          {/* Special Instructions */}
          <div className="mb-6 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-800 mb-2">SPECIAL INSTRUCTIONS:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              {effectiveIHD && (
                <p className="font-bold text-red-600">
                  ⚠️ RUSH ORDER - Must ship by {format(new Date(effectiveIHD), "MMMM dd, yyyy")}
                </p>
              )}
              {order?.isFirm && (
                <p className="font-bold text-blue-700">
                  📌 FIRM ORDER — Delivery date is locked and cannot be adjusted.
                </p>
              )}
              {order?.isRush && !effectiveIHD && (
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
