/**
 * Purchase Order PDF — react-pdf rewrite of PurchaseOrderTemplate.tsx.
 *
 * Handles two layouts via the `poType` prop:
 *   - "supplier"   → blank-goods PO with product cost lines
 *   - "decorator"  → decoration-only PO whose line items come from
 *                    `artworkCharges` (netCost), no product totals.
 *
 * Ship-to address is resolved from per-item shipToAddress / leg2Address with
 * fallbacks to decorator address and order-level shippingAddress, mirroring
 * the original template logic.
 */
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import {
  getImprintMethodLabel,
  getImprintLocationLabel,
} from "@/constants/imprintOptions";
import { getRenderableImageUrl } from "@/lib/media-library";
import { styles, colors } from "./styles";
import {
  fmtMoney,
  fmtDate,
  parseAddress,
  resolvePdfImage,
  formatPaymentTerms,
} from "./helpers";

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

export interface PurchaseOrderPdfProps {
  order: any;
  vendor: any;
  vendorItems: any[];
  poNumber: string;
  artworkItems?: any[];
  allArtworkCharges?: Record<string, any[]>;
  allItemCharges?: Record<string, any[]>;
  serviceCharges?: any[]; // CommonSKU pattern: order-level shipping/setup/etc. — filtered by displayToVendor + vendorId match
  vendorIHD?: string | null;
  vendorAddress?: VendorAddressData | null;
  poType?: "supplier" | "decorator";
  decoratorAddress?: VendorAddressData | null;
  sellerName?: string;
}

export function PurchaseOrderPdf({
  order,
  vendor,
  vendorItems,
  poNumber,
  artworkItems = [],
  allArtworkCharges = {},
  allItemCharges = {},
  serviceCharges = [],
  vendorIHD,
  vendorAddress,
  poType = "supplier",
  decoratorAddress,
  sellerName,
}: PurchaseOrderPdfProps) {
  const isDecoratorPO = poType === "decorator";
  const hasThirdPartyItems = vendorItems.some((i: any) => i.decoratorType === "third_party");
  const effectiveIHD = vendorIHD || order?.supplierInHandsDate;
  const orderShippingAddr = parseAddress(order?.shippingAddress);

  // ── Total cost calculation ─────────────────────────────────────
  // ── Service charges visible on this vendor PO (CommonSKU displayToVendor pattern) ──
  // Show charges where displayToVendor is not explicitly false AND vendor matches (or vendorId is null = applies to all)
  const vendorServiceCharges = serviceCharges.filter((c: any) =>
    c.displayToVendor !== false && (c.vendorId === vendor?.id || c.vendorId == null)
  );
  const serviceChargesTotal = vendorServiceCharges.reduce((sum: number, c: any) => {
    const qty = parseFloat(c.quantity || "1") || 1;
    const cost = parseFloat(c.unitCost || "0");
    return sum + qty * cost;
  }, 0);

  const itemsCost = isDecoratorPO
    ? artworkItems.reduce((sum: number, art: any) => {
      const charges = (allArtworkCharges[art.id] || []).filter(
        (c: any) => c.displayToVendor !== false,
      );
      return (
        sum +
        charges.reduce((s: number, c: any) => {
          const cost = parseFloat(c.netCost || "0");
          const qty =
            c.chargeCategory === "run"
              ? vendorItems.find((i: any) => i.id === art.orderItemId)?.quantity || 1
              : c.quantity || 1;
          return s + cost * qty;
        }, 0)
      );
    }, 0)
    : vendorItems.reduce((sum: number, item: any) => {
      const cost = parseFloat(item.cost) || parseFloat(item.unitPrice) || 0;
      return sum + cost * (item.quantity || 0);
    }, 0);

  const totalCost = itemsCost + serviceChargesTotal;

  // ── Resolve ship-to ────────────────────────────────────────────
  const resolveShipTo = () => {
    if (isDecoratorPO) {
      const itemWithLeg2 = vendorItems.find((i: any) => i.leg2Address);
      return itemWithLeg2?.leg2Address || orderShippingAddr;
    }
    if (hasThirdPartyItems) {
      const itemWithAddr = vendorItems.find(
        (i: any) => i.shipToAddress && i.decoratorType === "third_party"
      );
      return itemWithAddr?.shipToAddress || decoratorAddress || orderShippingAddr;
    }
    const itemWithAddr = vendorItems.find((i: any) => i.shipToAddress);
    return itemWithAddr?.shipToAddress || orderShippingAddr;
  };
  const shipToAddr = resolveShipTo();

  // ── Resolved IHD per item ──────────────────────────────────────
  const resolvedIHD = (() => {
    if (isDecoratorPO) {
      const item = vendorItems.find((i: any) => i.leg2InHandsDate);
      return item?.leg2InHandsDate || effectiveIHD;
    }
    const item = vendorItems.find((i: any) => i.shipInHandsDate);
    return item?.shipInHandsDate || effectiveIHD;
  })();

  const shipToLabel = !isDecoratorPO && hasThirdPartyItems
    ? "SHIP TO DECORATOR:"
    : isDecoratorPO
      ? "SHIP FINISHED GOODS TO:"
      : "SHIPPING ADDRESS:";

  return (
    <Document title={`Purchase Order ${poNumber}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={[styles.docTitle, { color: colors.green600 }]}>
              {isDecoratorPO ? "DECORATION ORDER" : "PURCHASE ORDER"}
            </Text>
            <Text style={styles.docMeta}>PO #{poNumber}</Text>
            <Text style={styles.docMeta}>Date: {fmtDate(order?.createdAt)}</Text>
            {order?.supplierInHandsDate && (
              <Text style={[styles.docMeta, styles.bold, { color: colors.red600 }]}>
                Required by: {fmtDate(order.supplierInHandsDate)}
              </Text>
            )}
            {order?.isFirm && (
              <Text style={[styles.docMeta, styles.bold, { color: colors.blue700 }]}>
                FIRM ORDER — Date cannot be adjusted
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.brandName}>{"Liquid Screen Design"}</Text>
          </View>
        </View>

        {/* ── Vendor block ─────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.addressLabel}>VENDOR:</Text>
          <Text style={[styles.addressLine, styles.bold, { fontSize: 11 }]}>
            {vendorAddress?.companyNameOnDocs || vendor?.name}
          </Text>
          {vendor?.contactPerson && (
            <Text style={styles.addressLine}>Attn: {vendor.contactPerson}</Text>
          )}
          {vendorAddress?.street && <Text style={styles.addressLine}>{vendorAddress.street}</Text>}
          {vendorAddress?.street2 && <Text style={styles.addressLine}>{vendorAddress.street2}</Text>}
          {(vendorAddress?.city || vendorAddress?.state || vendorAddress?.zipCode) && (
            <Text style={styles.addressLine}>
              {[vendorAddress?.city, vendorAddress?.state, vendorAddress?.zipCode]
                .filter(Boolean)
                .join(", ")}
            </Text>
          )}
          {vendorAddress?.country && vendorAddress.country !== "US" && (
            <Text style={styles.addressLine}>{vendorAddress.country}</Text>
          )}
          {vendor?.email && <Text style={styles.addressLine}>Email: {vendor.email}</Text>}
          {vendor?.phone && <Text style={styles.addressLine}>Phone: {vendor.phone}</Text>}
        </View>

        {/* ── Payment terms ────────────────────────────────────── */}
        {order?.paymentTerms && (
          <Text style={{ fontSize: 9, color: colors.gray700, marginBottom: 12 }}>
            <Text style={styles.bold}>Payment Terms: </Text>
            {formatPaymentTerms(order.paymentTerms)}
          </Text>
        )}

        {/* ── Ship-to ──────────────────────────────────────────── */}
        {shipToAddr && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.addressLabel}>{shipToLabel}</Text>
            {(shipToAddr.contactName || shipToAddr.companyNameOnDocs || shipToAddr.addressName) && (
              <Text style={[styles.addressLine, styles.bold]}>
                {shipToAddr.contactName || shipToAddr.companyNameOnDocs || shipToAddr.addressName}
              </Text>
            )}
            {(shipToAddr.street || shipToAddr.address) && (
              <Text style={styles.addressLine}>{shipToAddr.street || shipToAddr.address}</Text>
            )}
            {shipToAddr.street2 && <Text style={styles.addressLine}>{shipToAddr.street2}</Text>}
            <Text style={styles.addressLine}>
              {[shipToAddr.city, shipToAddr.state, shipToAddr.zipCode].filter(Boolean).join(", ")}
            </Text>
            {shipToAddr.email && <Text style={styles.addressLine}>{shipToAddr.email}</Text>}
            {shipToAddr.phone && <Text style={styles.addressLine}>{shipToAddr.phone}</Text>}
          </View>
        )}

        {/* ── Items ────────────────────────────────────────────── */}
        {vendorItems.map((item: any) => {
          const cost = parseFloat(item.cost) || parseFloat(item.unitPrice) || 0;
          const quantity = item.quantity || 0;
          const itemTotal = cost * quantity;
          const itemArtworks = artworkItems.filter((art: any) => art.orderItemId === item.id);
          const productImgSrc = resolvePdfImage(item.imageUrl || item.productImageUrl);

          return (
            <View key={item.id} style={styles.itemBlock} wrap={false}>
              <Text style={styles.itemTitle}>
                {item.productName}
              </Text>
              {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}

              <View style={styles.itemBody}>
                {productImgSrc && (
                  <View style={styles.productImageBox}>
                    <Image src={productImgSrc} style={styles.productImage} />
                    <Text style={styles.imageCaption}>Product image for reference only.</Text>
                  </View>
                )}

                <View style={styles.itemTableWrap}>
                  <View style={styles.tableHead}>
                    <Text style={[styles.tableHeadCell, styles.colItem]}>ITEM</Text>
                    <Text style={[styles.tableHeadCell, styles.colQty]}>QTY</Text>
                    <Text style={[styles.tableHeadCell, styles.colPrice]}>COST</Text>
                    <Text style={[styles.tableHeadCell, styles.colAmount]}>AMOUNT</Text>
                  </View>

                  {isDecoratorPO ? (
                    itemArtworks.flatMap((art: any) => {
                      const charges = (allArtworkCharges[art.id] || []).filter(
                        (c: any) => c.displayToVendor !== false,
                      );
                      return charges.map((c: any) => {
                        const chCost = parseFloat(c.netCost || "0");
                        const chQty = c.chargeCategory === "run" ? quantity : c.quantity || 1;
                        return (
                          <View key={c.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colItem]}>
                              {c.chargeName} — {art.name} (
                              {getImprintLocationLabel(art.location) || "N/A"}){" "}
                              <Text style={styles.muted}>
                                ({c.chargeCategory === "run" ? "per unit" : "one-time"})
                              </Text>
                            </Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{chQty}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(chCost)}</Text>
                            <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                              {fmtMoney(chCost * chQty)}
                            </Text>
                          </View>
                        );
                      });
                    })
                  ) : (
                    <>
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colItem]}>
                          {item.color && item.size
                            ? `Size: ${item.size} - Color: ${item.color}`
                            : item.color
                              ? `Color: ${item.color}`
                              : item.size
                                ? `Size: ${item.size}`
                                : item.productName}
                        </Text>
                        <Text style={[styles.tableCell, styles.colQty]}>{quantity}</Text>
                        <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(cost)}</Text>
                        <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                          {fmtMoney(itemTotal)}
                        </Text>
                      </View>
                      {(allItemCharges[item.id] || [])
                        .filter((charge: any) => charge.displayToVendor !== false)
                        .map((charge: any) => {
                          const chCost = parseFloat(charge.netCost || "0");
                          if (chCost <= 0) return null;
                          const chQty =
                            charge.chargeCategory === "run" ? quantity : charge.quantity || 1;
                          return (
                            <View key={charge.id} style={styles.tableRow}>
                              <Text style={[styles.tableCell, styles.colItem, styles.muted]}>
                                {charge.description}{" "}
                                <Text style={styles.muted}>
                                  ({charge.chargeCategory === "run" ? "per unit" : "one-time"})
                                </Text>
                              </Text>
                              <Text style={[styles.tableCell, styles.colQty]}>{chQty}</Text>
                              <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(chCost)}</Text>
                              <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                                {fmtMoney(chCost * chQty)}
                              </Text>
                            </View>
                          );
                        })}
                    </>
                  )}

                  <View style={styles.tableTotalRow}>
                    <Text style={[styles.tableCell, styles.colItem, styles.bold]}>TOTAL</Text>
                    <Text style={[styles.tableCell, styles.colQty]}> </Text>
                    <Text style={[styles.tableCell, styles.colPrice]}> </Text>
                    <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                      {isDecoratorPO ? "—" : fmtMoney(itemTotal)}
                    </Text>
                  </View>
                </View>
              </View>

              {itemArtworks.length > 0 && (
                <View style={styles.artworkBlock}>
                  <Text style={styles.artworkHeader}>Artwork Details</Text>
                  {itemArtworks.map((art: any, idx: number) => {
                    const artUrl = art.filePath || art.fileUrl;
                    const artSrc = resolvePdfImage(getRenderableImageUrl(artUrl) || artUrl);
                    const proofSrc =
                      art.proofFilePath && art.proofFilePath !== art.filePath
                        ? resolvePdfImage(getRenderableImageUrl(art.proofFilePath) || art.proofFilePath)
                        : null;
                    return (
                      <View key={art.id || idx} style={styles.artworkRow}>
                        <View style={styles.artworkFields}>
                          {art.name && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>DESIGN NAME</Text>
                              <Text style={styles.artworkFieldValue}>{art.name}</Text>
                            </View>
                          )}
                          {(art.artworkType || art.imprintMethod) && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>IMPRINT TYPE</Text>
                              <Text style={styles.artworkFieldValue}>
                                {getImprintMethodLabel(art.artworkType || art.imprintMethod)}
                              </Text>
                            </View>
                          )}
                          {art.location && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>DESIGN LOCATION</Text>
                              <Text style={styles.artworkFieldValue}>
                                {getImprintLocationLabel(art.location)}
                              </Text>
                            </View>
                          )}
                          {(art.size || art.designSize) && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>DESIGN SIZE</Text>
                              <Text style={styles.artworkFieldValue}>{art.size || art.designSize}</Text>
                            </View>
                          )}
                          {(art.color || art.colors) && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>DESIGN COLOR</Text>
                              <Text style={styles.artworkFieldValue}>{art.color || art.colors}</Text>
                            </View>
                          )}
                          {art.notes && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>NOTES</Text>
                              <Text style={styles.artworkFieldValue}>{art.notes}</Text>
                            </View>
                          )}
                          {art.proofFilePath && (
                            <View style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>PROOF STATUS</Text>
                              <Text style={styles.artworkFieldValue}>
                                {art.status === "approved" || art.status === "proofing_complete"
                                  ? "Approved"
                                  : art.status === "proof_received"
                                    ? "Received"
                                    : "Pending"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View>
                          {artSrc && <Image src={artSrc} style={styles.artworkThumb} />}
                          {proofSrc && (
                            <View style={{ marginTop: 4 }}>
                              <Text style={[styles.tiny, styles.muted]}>Vendor Proof:</Text>
                              <Image
                                src={proofSrc}
                                style={[styles.artworkThumb, { width: 60, height: 60 }]}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Services & Fees (shipping, setup, etc.) — vendor-visible only ─── */}
        {vendorServiceCharges.length > 0 && (
          <View wrap={false}>
            <View style={styles.tableHead}>
              <Text style={[styles.tableHeadCell, styles.colItem]}>SERVICES &amp; FEES</Text>
              <Text style={[styles.tableHeadCell, styles.colQty]}>QTY</Text>
              <Text style={[styles.tableHeadCell, styles.colPrice]}>COST</Text>
              <Text style={[styles.tableHeadCell, styles.colAmount]}>AMOUNT</Text>
            </View>
            {vendorServiceCharges.map((c: any) => {
              const qty = parseFloat(c.quantity || "1") || 1;
              const cost = parseFloat(c.unitCost || "0");
              return (
                <View key={c.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colItem]}>
                    {c.description || c.chargeType}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{qty}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(cost)}</Text>
                  <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>{fmtMoney(qty * cost)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Grand total ──────────────────────────────────────── */}
        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsGrandRow}>
              <Text>Total Cost:</Text>
              <Text>{fmtMoney(totalCost)}</Text>
            </View>
          </View>
        </View>

        {/* ── Special instructions ─────────────────────────────── */}
        <View style={styles.notesBlock} wrap={false}>
          <Text style={styles.notesLabel}>SPECIAL INSTRUCTIONS:</Text>
          {order?.isFirm && (
            <Text style={[styles.notesText, styles.bold, { color: colors.blue700 }]}>
              FIRM ORDER — Delivery date is locked and cannot be adjusted.
            </Text>
          )}
          {order?.supplierNotes && <Text style={styles.notesText}>{order.supplierNotes}</Text>}
          {order?.notes && <Text style={styles.notesText}>{order.notes}</Text>}
          <Text style={styles.notesText}>
            Please confirm receipt of this PO and provide production timeline.
          </Text>
        </View>

        {/* ── Footer ──────────────────────────────────────────── */}
        <View style={styles.pageFooter} fixed>
          <Text>Please confirm receipt and provide tracking information when shipped.</Text>
        </View>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
