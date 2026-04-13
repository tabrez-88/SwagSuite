/**
 * Sales Order PDF — react-pdf rewrite of SalesOrderTemplate.tsx.
 *
 * Same structure as QuotePdf but uses an emerald accent color and adds the
 * Customer PO + Firm/Rush badges that the client-facing SO needs. Items are
 * wrapped with `wrap={false}` so a long order pages cleanly without
 * splitting an item table mid-row.
 */
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import {
  getImprintMethodLabel,
  getImprintLocationLabel,
} from "@/constants/imprintOptions";
import {
  getItemPricing,
  type PricingLine,
  type ProductCharge,
  type DecorationCharge,
} from "@/lib/pricing";
import { getRenderableImageUrl } from "@/lib/media-library";
import { styles, colors } from "./styles";
import {
  fmtMoney,
  fmtDate,
  parseAddress,
  resolvePdfImage,
  formatPaymentTerms,
  formatCityLine,
} from "./helpers";
import { formatLabel } from "@/lib/utils";

export interface SalesOrderPdfProps {
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
  allItemLines?: Record<string, any[]>;
  allArtworkItems?: Record<string, any[]>;
  allItemCharges?: Record<string, any[]>;
  allArtworkCharges?: Record<string, any[]>;
  serviceCharges?: any[];
  assignedUser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  } | null;
  sellerName?: string;
}

export function SalesOrderPdf({
  order,
  orderItems,
  companyName,
  primaryContact,
  allItemLines = {},
  allArtworkItems = {},
  allItemCharges = {},
  allArtworkCharges = {},
  serviceCharges = [],
  assignedUser,
  sellerName,
}: SalesOrderPdfProps) {
  const billingAddr = parseAddress(order?.billingAddress);
  const shippingAddr = parseAddress(order?.shippingAddress);

  const subtotal = orderItems.reduce((sum: number, item: any) => {
    const realLines = allItemLines[item.id] || [];
    const lines: PricingLine[] =
      realLines.length > 0
        ? realLines.map((l: any) => ({
            quantity: l.quantity || 0,
            cost: parseFloat(l.cost || "0"),
            unitPrice: parseFloat(l.unitPrice || "0"),
          }))
        : [
            {
              quantity: item.quantity || 0,
              cost: parseFloat(item.cost || "0"),
              unitPrice: parseFloat(item.unitPrice || "0"),
            },
          ];
    const itemCharges = (allItemCharges[item.id] || []) as ProductCharge[];
    const decoCharges: DecorationCharge[] = [];
    for (const art of allArtworkItems[item.id] || []) {
      for (const c of allArtworkCharges[art.id] || []) decoCharges.push(c as DecorationCharge);
    }
    return sum + getItemPricing(lines, itemCharges, decoCharges, item).itemSellGrandTotal;
  }, 0);

  const shipping = parseFloat(order?.shippingCost) || parseFloat(order?.shipping) || 0;
  const tax = parseFloat(order?.tax) || 0;
  const clientServiceCharges = serviceCharges.filter((c: any) => c.displayToClient !== false);
  const serviceChargesTotal = clientServiceCharges.reduce(
    (sum: number, c: any) => sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0"),
    0
  );
  const total = subtotal + serviceChargesTotal + shipping + tax;

  const repProfileSrc = resolvePdfImage(assignedUser?.profileImageUrl);

  return (
    <Document title={`Sales Order ${order?.orderNumber || ""}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={[styles.docTitle, { color: colors.emerald600 }]}>SALES ORDER</Text>
            <Text style={styles.docMeta}>SO #{order?.orderNumber || "N/A"}</Text>
            <Text style={styles.docMeta}>Date: {fmtDate(order?.createdAt)}</Text>
            {order?.inHandsDate && (
              <Text style={styles.docMeta}>In-Hands Date: {fmtDate(order.inHandsDate)}</Text>
            )}
            {order?.eventDate && (
              <Text style={styles.docMeta}>Event Date: {fmtDate(order.eventDate)}</Text>
            )}
            {order?.customerPo && (
              <Text style={styles.docMeta}>Customer PO: {order.customerPo}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.brandName}>{sellerName || "Liquid Screen Design"}</Text>
            {order?.isFirm && (
              <View style={[styles.badge, styles.badgeBlue, { marginTop: 6 }]}>
                <Text>FIRM ORDER</Text>
              </View>
            )}
            {order?.isRush && (
              <View style={[styles.badge, styles.badgeRed, { marginTop: 4 }]}>
                <Text>RUSH ORDER</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Addresses ────────────────────────────────────────── */}
        <View style={styles.addressGrid}>
          <View style={styles.addressCol}>
            <Text style={styles.addressLabel}>BILLING ADDRESS:</Text>
            <Text style={[styles.addressLine, styles.bold]}>{companyName || "N/A"}</Text>
            {billingAddr?.contactName && <Text style={styles.addressLine}>{billingAddr.contactName}</Text>}
            {!billingAddr?.contactName && primaryContact && (
              <Text style={styles.addressLine}>
                {primaryContact.firstName} {primaryContact.lastName}
              </Text>
            )}
            {billingAddr?.street && <Text style={styles.addressLine}>{billingAddr.street}</Text>}
            {billingAddr?.street2 && <Text style={styles.addressLine}>{billingAddr.street2}</Text>}
            {billingAddr && <Text style={styles.addressLine}>{formatCityLine(billingAddr)}</Text>}
            {(billingAddr?.email || primaryContact?.email) && (
              <Text style={styles.addressLine}>{billingAddr?.email || primaryContact?.email}</Text>
            )}
            {(billingAddr?.phone || primaryContact?.phone) && (
              <Text style={styles.addressLine}>{billingAddr?.phone || primaryContact?.phone}</Text>
            )}
          </View>
          <View style={styles.addressCol}>
            <Text style={styles.addressLabel}>SHIPPING ADDRESS:</Text>
            {shippingAddr ? (
              <>
                <Text style={[styles.addressLine, styles.bold]}>{companyName}</Text>
                {shippingAddr.contactName && (
                  <Text style={styles.addressLine}>{shippingAddr.contactName}</Text>
                )}
                {!shippingAddr.contactName && primaryContact && (
                  <Text style={styles.addressLine}>
                    {primaryContact.firstName} {primaryContact.lastName}
                  </Text>
                )}
                {(shippingAddr.street || shippingAddr.address) && (
                  <Text style={styles.addressLine}>{shippingAddr.street || shippingAddr.address}</Text>
                )}
                {shippingAddr.street2 && <Text style={styles.addressLine}>{shippingAddr.street2}</Text>}
                <Text style={styles.addressLine}>{formatCityLine(shippingAddr)}</Text>
              </>
            ) : (
              <Text style={[styles.addressLine, styles.muted]}>Not specified</Text>
            )}
          </View>
        </View>

        {/* ── Sales rep + payment terms ────────────────────────── */}
        {(assignedUser || order?.paymentTerms) && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            {order?.paymentTerms && (
              <Text style={{ fontSize: 9, color: colors.gray700 }}>
                <Text style={styles.bold}>Payment Terms: </Text>
                {formatPaymentTerms(order.paymentTerms)}
              </Text>
            )}
            {assignedUser && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {repProfileSrc && (
                  <Image
                    src={repProfileSrc}
                    style={{ width: 26, height: 26, borderRadius: 13, objectFit: "cover" }}
                  />
                )}
                <View>
                  <Text style={[styles.tiny, styles.bold]}>Your Sales Rep</Text>
                  <Text style={styles.tiny}>
                    {[assignedUser.firstName, assignedUser.lastName].filter(Boolean).join(" ")}
                  </Text>
                  {assignedUser.email && (
                    <Text style={[styles.tiny, styles.muted]}>{assignedUser.email}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Items ────────────────────────────────────────────── */}
        {orderItems.map((item: any) => {
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const quantity = item.quantity || 0;
          const itemTotal = parseFloat(item.totalPrice) || unitPrice * quantity;
          const itemArtworks = allArtworkItems[item.id] || [];
          const itemCharges = (allItemCharges[item.id] || []).filter(
            (c: any) => c.displayToClient && !c.includeInUnitPrice
          );
          const productImgSrc = resolvePdfImage(item.imageUrl || item.productImageUrl);

          return (
            <View key={item.id} style={styles.itemBlock} wrap={false}>
              <Text style={styles.itemTitle}>{item.productName}</Text>
              {(item.description || item.productDescription) && (
                <Text style={styles.itemDesc}>{item.description || item.productDescription}</Text>
              )}
              {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}

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
                    <Text style={[styles.tableHeadCell, styles.colPrice]}>PRICE</Text>
                    <Text style={[styles.tableHeadCell, styles.colAmount]}>AMOUNT</Text>
                  </View>

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
                    <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(unitPrice)}</Text>
                    <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                      {fmtMoney(itemTotal)}
                    </Text>
                  </View>

                  {itemCharges.map((charge: any) => {
                    const chargeAmt = parseFloat(charge.retailPrice || charge.amount || "0");
                    const chargeQty =
                      charge.chargeCategory === "run" ? quantity : charge.quantity || 1;
                    return (
                      <View key={charge.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colItem, styles.muted]}>
                          {charge.description}
                          {charge.chargeCategory === "run" && " (per unit)"}
                        </Text>
                        <Text style={[styles.tableCell, styles.colQty]}>{chargeQty}</Text>
                        <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(chargeAmt)}</Text>
                        <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                          {fmtMoney(chargeAmt * chargeQty)}
                        </Text>
                      </View>
                    );
                  })}

                  <View style={styles.tableTotalRow}>
                    <Text style={[styles.tableCell, styles.colItem, styles.bold]}>TOTAL</Text>
                    <Text style={[styles.tableCell, styles.colQty]}> </Text>
                    <Text style={[styles.tableCell, styles.colPrice]}> </Text>
                    <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                      {fmtMoney(itemTotal)}
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
                    const artCharges = (allArtworkCharges[art.id] || []).filter(
                      (c: any) => c.displayMode === "display_to_client"
                    );
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
                          {artCharges.map((c: any) => (
                            <View key={c.id} style={styles.artworkFieldRow}>
                              <Text style={styles.artworkFieldLabel}>
                                {c.chargeCategory === "run" ? "IMPRINT COST" : "SETUP COST"}
                              </Text>
                              <Text style={styles.artworkFieldValue}>
                                {formatLabel(c.chargeName)}: {fmtMoney(c.retailPrice)}
                                {c.chargeCategory === "run" ? " per unit" : " (one-time)"}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {artSrc && <Image src={artSrc} style={styles.artworkThumb} />}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Service Charges ──────────────────────────────────── */}
        {clientServiceCharges.length > 0 && (
          <View style={{ marginBottom: 12 }} wrap={false}>
            <Text style={styles.artworkHeader}>Services & Fees</Text>
            <View style={styles.tableHead}>
              <Text style={[styles.tableHeadCell, styles.colItem]}>SERVICE</Text>
              <Text style={[styles.tableHeadCell, styles.colQty]}>QTY</Text>
              <Text style={[styles.tableHeadCell, styles.colPrice]}>PRICE</Text>
              <Text style={[styles.tableHeadCell, styles.colAmount]}>AMOUNT</Text>
            </View>
            {clientServiceCharges.map((charge: any) => {
              const qty = charge.quantity || 1;
              const price = parseFloat(charge.unitPrice || "0");
              return (
                <View key={charge.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colItem]}>{charge.description}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{qty}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(price)}</Text>
                  <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                    {fmtMoney(qty * price)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Totals ───────────────────────────────────────────── */}
        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal:</Text>
              <Text>{fmtMoney(subtotal)}</Text>
            </View>
            {serviceChargesTotal > 0 && (
              <View style={styles.totalsRow}>
                <Text>Services & Fees:</Text>
                <Text>{fmtMoney(serviceChargesTotal)}</Text>
              </View>
            )}
            {shipping > 0 && (
              <View style={styles.totalsRow}>
                <Text>Shipping:</Text>
                <Text>{fmtMoney(shipping)}</Text>
              </View>
            )}
            {tax > 0 && (
              <View style={styles.totalsRow}>
                <Text>Tax:</Text>
                <Text>{fmtMoney(tax)}</Text>
              </View>
            )}
            <View style={styles.totalsGrandRow}>
              <Text>Total:</Text>
              <Text>{fmtMoney(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ────────────────────────────────────────────── */}
        {order?.notes && (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesLabel}>NOTES:</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <View style={styles.pageFooter} fixed>
          <Text>Thank you for your business!</Text>
          <Text style={{ marginTop: 2 }}>
            This sales order confirms the agreed-upon terms for the products listed above.
          </Text>
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
