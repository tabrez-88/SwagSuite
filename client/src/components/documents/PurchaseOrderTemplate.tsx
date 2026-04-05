import { forwardRef } from "react";
import { format } from "date-fns";
import { proxyImg } from "@/lib/imageUtils";
import { getImprintMethodLabel, getImprintLocationLabel } from "@/constants/imprintOptions";
import { getRenderableImageUrl } from "@/lib/media-library";

interface VendorAddressData {
  addressName?: string | null;
  companyNameOnDocs?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  addressType?: string;
}

interface PurchaseOrderTemplateProps {
  order: any;
  vendor: any;
  vendorItems: any[];
  poNumber: string;
  artworkItems?: any[];
  allArtworkCharges?: Record<string, any[]>;
  vendorIHD?: string | null;
  vendorAddress?: VendorAddressData | null;
  poType?: "supplier" | "decorator"; // supplier = blank goods (or all-in-one), decorator = decoration only
  decoratorAddress?: VendorAddressData | null; // Ship-to address for blank goods → decorator
}

const PurchaseOrderTemplate = forwardRef<HTMLDivElement, PurchaseOrderTemplateProps>(
  ({ order, vendor, vendorItems, poNumber, artworkItems = [], allArtworkCharges = {}, vendorIHD, vendorAddress, poType = "supplier", decoratorAddress }, ref) => {
    // Effective supplier IHD: vendor-specific → order-level fallback
    const effectiveIHD = vendorIHD || order?.supplierInHandsDate;
    const shippingAddr = (() => {
      try {
        return order?.shippingAddress ? JSON.parse(order.shippingAddress) : null;
      } catch { return null; }
    })();

    const isDecoratorPO = poType === "decorator";
    const hasThirdPartyItems = vendorItems.some((i: any) => i.decoratorType === "third_party");

    const totalCost = isDecoratorPO
      ? // Decorator PO: sum artwork charges (netCost)
        artworkItems.reduce((sum: number, art: any) => {
          const charges = allArtworkCharges[art.id] || [];
          return sum + charges.reduce((s: number, c: any) => {
            const cost = parseFloat(c.netCost || "0");
            const qty = c.chargeCategory === "run"
              ? (vendorItems.find((i: any) => i.id === art.orderItemId)?.quantity || 1)
              : (c.quantity || 1);
            return s + cost * qty;
          }, 0);
        }, 0)
      : // Supplier PO: product costs
        vendorItems.reduce((sum: number, item: any) => {
          const cost = parseFloat(item.cost) || parseFloat(item.unitPrice) || 0;
          const quantity = item.quantity || 0;
          return sum + cost * quantity;
        }, 0);

    // Resolve ship-to address: per-item addresses → decorator address → order-level fallback
    const resolveShipTo = () => {
      // For decorator POs: use leg2 address (decorator → client)
      if (isDecoratorPO) {
        const itemWithLeg2 = vendorItems.find((i: any) => i.leg2Address);
        return itemWithLeg2?.leg2Address || shippingAddr;
      }
      // For supplier POs with third-party items: ship to decorator (item's shipToAddress)
      if (hasThirdPartyItems) {
        const itemWithAddr = vendorItems.find((i: any) => i.shipToAddress && i.decoratorType === "third_party");
        return itemWithAddr?.shipToAddress || decoratorAddress || shippingAddr;
      }
      // Standard supplier PO: use per-item ship-to or order-level
      const itemWithAddr = vendorItems.find((i: any) => i.shipToAddress);
      return itemWithAddr?.shipToAddress || shippingAddr;
    };
    const shipToAddr = resolveShipTo();

    // Per-item in-hands date: use first item's shipInHandsDate or fallback to effectiveIHD
    const resolvedIHD = (() => {
      if (isDecoratorPO) {
        const item = vendorItems.find((i: any) => i.leg2InHandsDate);
        return item?.leg2InHandsDate || effectiveIHD;
      }
      const item = vendorItems.find((i: any) => i.shipInHandsDate);
      return item?.shipInHandsDate || effectiveIHD;
    })();
    const hasFirmDate = vendorItems.some((i: any) => isDecoratorPO ? i.leg2Firm : i.shipFirm);

    return (
      <div ref={ref} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
        <div className="p-8 bg-white" style={{ width: "794px", minHeight: "1123px" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
            <div>
              <h1 className="text-4xl font-bold text-green-600 mb-2">
                {isDecoratorPO ? "DECORATION ORDER" : "PURCHASE ORDER"}
              </h1>
              <p className="text-sm text-gray-700">PO #{poNumber}</p>
              <p className="text-sm text-gray-700">
                Date: {order?.createdAt ? format(new Date(order.createdAt), "MMMM dd, yyyy") : "N/A"}
              </p>
              {resolvedIHD && (
                <p className="text-sm font-bold text-red-600">
                  Required by: {format(new Date(resolvedIHD), "MMMM dd, yyyy")}
                </p>
              )}
              {order?.isFirm && (
                <p className="text-sm font-bold text-blue-700">FIRM ORDER — Date cannot be adjusted</p>
              )}
              {order?.isRush && !resolvedIHD && (
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
              <p className="font-bold text-lg">{vendorAddress?.companyNameOnDocs || vendor.name}</p>
              {vendorAddress ? (
                <>
                  {vendorAddress.street && <p>{vendorAddress.street}</p>}
                  {vendorAddress.street2 && <p>{vendorAddress.street2}</p>}
                  {(vendorAddress.city || vendorAddress.state || vendorAddress.zipCode) && (
                    <p>{[vendorAddress.city, vendorAddress.state, vendorAddress.zipCode].filter(Boolean).join(", ")}</p>
                  )}
                  {vendorAddress.country && vendorAddress.country !== "US" && <p>{vendorAddress.country}</p>}
                </>
              ) : null}
              {vendor.email && <p>Email: {vendor.email}</p>}
              {vendor.phone && <p>Phone: {vendor.phone}</p>}
            </div>
          </div>

          {/* Payment Terms */}
          {order?.paymentTerms && (
            <div className="text-sm mb-4">
              <span className="font-bold text-gray-800">Payment Terms: </span>
              <span className="text-gray-700">{order.paymentTerms.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
            </div>
          )}

          {/* Shipping Address */}
          {shipToAddr && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                {!isDecoratorPO && hasThirdPartyItems
                  ? "SHIP TO DECORATOR:"
                  : isDecoratorPO
                    ? "SHIP FINISHED GOODS TO:"
                    : "SHIPPING ADDRESS:"}
              </h3>
              <div className="text-sm text-gray-700">
                {(shipToAddr.contactName || shipToAddr.companyNameOnDocs || shipToAddr.addressName) && (
                  <p className="font-semibold">{shipToAddr.contactName || shipToAddr.companyNameOnDocs || shipToAddr.addressName}</p>
                )}
                {(shipToAddr.street || shipToAddr.address) && <p>{shipToAddr.street || shipToAddr.address}</p>}
                {shipToAddr.street2 && <p>{shipToAddr.street2}</p>}
                <p>{[shipToAddr.city, shipToAddr.state, shipToAddr.zipCode].filter(Boolean).join(", ")}</p>
                {shipToAddr.email && <p>{shipToAddr.email}</p>}
                {shipToAddr.phone && <p>{shipToAddr.phone}</p>}
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
                          {isDecoratorPO ? (
                            <>
                              {/* Decorator PO: show artwork charges as line items */}
                              {itemArtworks.map((art: any) => {
                                const charges = allArtworkCharges[art.id] || [];
                                return charges.map((c: any) => {
                                  const chCost = parseFloat(c.netCost || "0");
                                  const chQty = c.chargeCategory === "run" ? quantity : (c.quantity || 1);
                                  return (
                                    <tr key={c.id} className="border-b border-gray-100">
                                      <td className="py-1.5 text-xs">
                                        {c.chargeName} — {art.name} ({getImprintLocationLabel(art.location) || "N/A"})
                                        <span className="text-gray-400 ml-1">({c.chargeCategory === "run" ? "per unit" : "one-time"})</span>
                                      </td>
                                      <td className="py-1.5 text-xs text-center">{chQty}</td>
                                      <td className="py-1.5 text-xs text-right">${chCost.toFixed(2)}</td>
                                      <td className="py-1.5 text-xs text-right font-medium">${(chCost * chQty).toFixed(2)}</td>
                                    </tr>
                                  );
                                });
                              })}
                            </>
                          ) : (
                            <>
                              {/* Supplier PO: show product cost */}
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
                            </>
                          )}
                          <tr className="border-t border-gray-300">
                            <td className="py-1.5 text-xs font-bold">TOTAL</td>
                            <td></td>
                            <td></td>
                            <td className="py-1.5 text-xs text-right font-bold">${isDecoratorPO ? "—" : `$${itemTotal.toFixed(2)}`}</td>
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
                                    <td className="py-0.5 text-gray-700">{getImprintMethodLabel(art.artworkType || art.imprintMethod)}</td>
                                  </tr>
                                )}
                                {art.location && (
                                  <tr>
                                    <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN LOCATION</td>
                                    <td className="py-0.5 text-gray-700">{getImprintLocationLabel(art.location)}</td>
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
                            {(() => {
                              const artUrl = art.filePath || art.fileUrl;
                              const renderUrl = getRenderableImageUrl(artUrl);
                              if (!artUrl) return null;
                              return (
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
                              );
                            })()}
                            {/* Proof thumbnail if different */}
                            {(() => {
                              if (!art.proofFilePath || art.proofFilePath === art.filePath) return null;
                              const proofRenderUrl = getRenderableImageUrl(art.proofFilePath);
                              return (
                                <div>
                                  <p className="text-[8px] text-gray-500 mb-0.5">Vendor Proof:</p>
                                  <div style={{ width: "80px", height: "80px" }} className="border rounded bg-white overflow-hidden flex items-center justify-center">
                                    {proofRenderUrl ? (
                                      <img src={proxyImg(proofRenderUrl)} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                      <div className="text-center p-1">
                                        <div style={{ fontSize: "18px" }}>📎</div>
                                        <p style={{ fontSize: "6px" }} className="text-gray-500 mt-0.5 break-all">{art.proofFilePath.split('/').pop()?.split('?')[0]}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
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
                            <td className="py-0.5 text-gray-700">{getImprintMethodLabel(art.artworkType || art.imprintMethod)}</td>
                          </tr>
                        )}
                        {art.location && (
                          <tr>
                            <td className="py-0.5 pr-4 font-bold text-gray-800 whitespace-nowrap">DESIGN LOCATION</td>
                            <td className="py-0.5 text-gray-700">{getImprintLocationLabel(art.location)}</td>
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

          {/* Special Instructions */}
          <div className="mb-6 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-800 mb-2">SPECIAL INSTRUCTIONS:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              {resolvedIHD && (
                <p className="font-bold text-red-600">
                  ⚠️ RUSH ORDER - Must ship by {format(new Date(resolvedIHD), "MMMM dd, yyyy")}
                </p>
              )}
              {order?.isFirm && (
                <p className="font-bold text-blue-700">
                  📌 FIRM ORDER — Delivery date is locked and cannot be adjusted.
                </p>
              )}
              {order?.isRush && !resolvedIHD && (
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
