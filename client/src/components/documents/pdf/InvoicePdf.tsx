/**
 * Invoice PDF — CommonSKU-style flat summary table layout.
 *
 * Shows: header with seller + client info, info grid (addresses + amount due +
 * invoice details), flat item table with charge sub-rows, and footer totals.
 */
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { getImprintLocationLabel } from "@/constants/imprintOptions";
import { styles, colors } from "./styles";
import {
  fmtMoney,
  fmtDate,
  parseAddress,
  formatCityLine,
  formatPaymentTerms,
} from "./helpers";

export interface InvoicePdfProps {
  invoice: any;
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

export function InvoicePdf({
  invoice,
  order,
  orderItems,
  companyName,
  primaryContact,
  allArtworkItems = {},
  allItemCharges = {},
  allArtworkCharges = {},
  serviceCharges = [],
  sellerName,
}: InvoicePdfProps) {
  const billingAddr = parseAddress(order?.billingAddress);
  const shippingAddr = parseAddress(order?.shippingAddress);

  // Items subtotal (product lines only)
  const itemsSubtotal = orderItems.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.totalPrice) || 0),
    0,
  );

  // Additional charges per item (displayToClient only, excluding includeInUnitPrice)
  const additionalChargesTotal = orderItems.reduce((sum: number, item: any) => {
    const charges = (allItemCharges[item.id] || []).filter(
      (c: any) => c.displayToClient && !c.includeInUnitPrice,
    );
    return (
      sum +
      charges.reduce((s: number, c: any) => {
        const price = parseFloat(c.retailPrice || c.amount || "0");
        const qty =
          c.chargeCategory === "run" ? item.quantity || 1 : c.quantity || 1;
        return s + price * qty;
      }, 0)
    );
  }, 0);

  // Artwork/decoration charges (displayToClient only)
  const artworkChargesTotal = orderItems.reduce((sum: number, item: any) => {
    const arts = allArtworkItems[item.id] || [];
    return (
      sum +
      arts.reduce((s: number, art: any) => {
        const charges = (allArtworkCharges[art.id] || []).filter(
          (c: any) => c.displayMode !== "subtract_from_margin",
        );
        return (
          s +
          charges.reduce((s2: number, c: any) => {
            const price = parseFloat(c.retailPrice || "0");
            const qty =
              c.chargeCategory === "run" ? item.quantity || 1 : c.quantity || 1;
            return s2 + price * qty;
          }, 0)
        );
      }, 0)
    );
  }, 0);

  const shipping =
    parseFloat(order?.shippingCost) || parseFloat(order?.shipping) || 0;
  const tax = parseFloat(invoice?.taxAmount) || parseFloat(order?.tax) || 0;
  const clientServiceCharges = serviceCharges.filter(
    (c: any) => c.displayToClient !== false,
  );
  const serviceChargesTotal = clientServiceCharges.reduce(
    (sum: number, c: any) =>
      sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0"),
    0,
  );
  const subtotal =
    itemsSubtotal +
    additionalChargesTotal +
    artworkChargesTotal +
    serviceChargesTotal;
  const total = parseFloat(invoice?.totalAmount) || subtotal + shipping + tax;

  const isOverdue = invoice?.status === "overdue";
  const isPaid = invoice?.status === "paid";

  // Tax exempt check
  const taxRate = parseFloat(order?.taxRate) || 0;
  const taxExempt = tax === 0;

  return (
    <Document title={`Invoice ${invoice?.invoiceNumber || ""}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* ── Header: Seller Name + Invoice Title ──────────────── */}
        <View style={{ marginBottom: 16 }} fixed>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Helvetica-Bold",
              color: colors.gray900,
              marginBottom: 2,
            }}
          >
            {"Liquid Screen Design"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Helvetica-Bold",
                color: colors.gray800,
              }}
            >
              INVOICE
            </Text>
            <Text style={{ fontSize: 11, color: colors.gray600 }}>
              for {companyName || "Client"}
              {order?.projectName ? ` — ${order.projectName}` : ""}
            </Text>
            {isOverdue && (
              <View
                style={[styles.badge, styles.badgeRed, { marginLeft: "auto" }]}
              >
                <Text>PAST DUE</Text>
              </View>
            )}
            {isPaid && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    marginLeft: "auto",
                  },
                ]}
              >
                <Text>PAID</Text>
              </View>
            )}
          </View>
          <View
            style={{ height: 2, backgroundColor: colors.gray800, marginTop: 6 }}
          />
        </View>

        {/* ── Info Grid: Addresses + Amount Due + Details ───────── */}
        <View style={{ flexDirection: "row", marginBottom: 16, gap: 12 }}>
          {/* Shipping Address */}
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>SHIPPING ADDRESS</Text>
            {shippingAddr ? (
              <>
                <Text style={[styles.addressLine, styles.bold]}>
                  {shippingAddr.name || companyName || "N/A"}
                </Text>
                /
                {primaryContact && (
                  <Text style={styles.addressLine}>
                    {primaryContact.firstName} {primaryContact.lastName}
                  </Text>
                )}
                {shippingAddr.street && (
                  <Text style={styles.addressLine}>{shippingAddr.street}</Text>
                )}
                {shippingAddr.street2 && (
                  <Text style={styles.addressLine}>{shippingAddr.street2}</Text>
                )}
                <Text style={styles.addressLine}>
                  {formatCityLine(shippingAddr)}
                </Text>
              </>
            ) : (
              <Text style={[styles.addressLine, styles.muted]}>
                Same as billing
              </Text>
            )}
          </View>

          {/* Billing Address */}
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>BILLING ADDRESS</Text>
            <Text style={[styles.addressLine, styles.bold]}>
              {companyName || "N/A"}
            </Text>
            {primaryContact && (
              <Text style={styles.addressLine}>
                {primaryContact.firstName} {primaryContact.lastName}
              </Text>
            )}
            {billingAddr?.street && (
              <Text style={styles.addressLine}>{billingAddr.street}</Text>
            )}
            {billingAddr?.street2 && (
              <Text style={styles.addressLine}>{billingAddr.street2}</Text>
            )}
            {billingAddr && (
              <Text style={styles.addressLine}>
                {formatCityLine(billingAddr)}
              </Text>
            )}
          </View>

          {/* Amount Due */}
          <View
            style={{
              flex: 0.8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.gray200,
              borderRadius: 4,
              padding: 10,
            }}
          >
            <Text
              style={{ fontSize: 8, color: colors.gray500, marginBottom: 2 }}
            >
              AMOUNT DUE
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Helvetica-Bold",
                color: colors.gray800,
              }}
            >
              {fmtMoney(total)}
            </Text>
          </View>

          {/* Invoice Details */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 8, color: colors.gray500 }}>
                Project #
              </Text>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                {order?.orderNumber || "N/A"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 8, color: colors.gray500 }}>
                Invoice #
              </Text>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                {invoice?.invoiceNumber || "N/A"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 8, color: colors.gray500 }}>Date</Text>
              <Text style={{ fontSize: 8 }}>{fmtDate(invoice?.createdAt)}</Text>
            </View>
            {invoice?.dueDate && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 8, color: colors.gray500 }}>
                  Due Date
                </Text>
                <Text
                  style={{
                    fontSize: 8,
                    fontFamily: "Helvetica-Bold",
                    color: isOverdue ? colors.red600 : colors.gray800,
                  }}
                >
                  {fmtDate(invoice.dueDate)}
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 8, color: colors.gray500 }}>Terms</Text>
              <Text style={{ fontSize: 8 }}>
                {formatPaymentTerms(order?.paymentTerms) || "Net 30"}
              </Text>
            </View>
            {order?.customerPo && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 8, color: colors.gray500 }}>
                  Customer PO
                </Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                  {order.customerPo}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Flat Summary Table ────────────────────────────────── */}
        <View
          style={[
            styles.tableHead,
            {
              backgroundColor: colors.gray700,
              borderRadius: 2,
              paddingHorizontal: 6,
            },
          ]}
        >
          <Text
            style={[
              styles.tableHeadCell,
              styles.colItem,
              { color: colors.white },
            ]}
          >
            ITEM
          </Text>
          <Text
            style={[
              styles.tableHeadCell,
              styles.colQty,
              { color: colors.white },
            ]}
          >
            QTY
          </Text>
          <Text
            style={[
              styles.tableHeadCell,
              styles.colPrice,
              { color: colors.white },
            ]}
          >
            PRICE
          </Text>
          <Text
            style={[
              styles.tableHeadCell,
              styles.colAmount,
              { color: colors.white },
            ]}
          >
            AMOUNT
          </Text>
        </View>

        {orderItems.map((item: any) => {
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const quantity = item.quantity || 0;
          const itemTotal = parseFloat(item.totalPrice) || unitPrice * quantity;
          const itemArtworks = allArtworkItems[item.id] || [];
          const itemCharges = (allItemCharges[item.id] || []).filter(
            (c: any) => c.displayToClient && !c.includeInUnitPrice,
          );

          return (
            <View key={item.id} wrap={false}>
              {/* Product row */}
              <View style={[styles.tableRow, { paddingHorizontal: 6 }]}>
                <View style={[styles.colItem, { flexDirection: "column" }]}>
                  <Text style={[styles.tableCell, styles.bold]}>
                    {item.productName || item.name || "Product"}
                  </Text>
                  {item.notes && (
                    <Text
                      style={{
                        fontSize: 7,
                        color: colors.gray500,
                        fontFamily: "Helvetica-Oblique",
                        marginTop: 1,
                      }}
                    >
                      {item.notes}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {quantity}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {fmtMoney(unitPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                  {fmtMoney(itemTotal)}
                </Text>
              </View>

              {/* Item charges as sub-rows */}
              {itemCharges.map((charge: any) => {
                const chargeAmt = parseFloat(
                  charge.retailPrice || charge.amount || "0",
                );
                const chargeQty =
                  charge.chargeCategory === "run"
                    ? quantity
                    : charge.quantity || 1;
                return (
                  <View
                    key={charge.id}
                    style={[
                      styles.tableRow,
                      { paddingHorizontal: 6, backgroundColor: colors.gray100 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        styles.colItem,
                        styles.muted,
                      ]}
                    >
                      {charge.description}
                      {charge.chargeCategory === "run" ? " (per unit)" : ""}
                    </Text>
                    <Text style={[styles.tableCell, styles.colQty]}>
                      {chargeQty}
                    </Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>
                      {fmtMoney(chargeAmt)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colAmount]}>
                      {fmtMoney(chargeAmt * chargeQty)}
                    </Text>
                  </View>
                );
              })}

              {/* Artwork charges as sub-rows */}
              {itemArtworks.map((art: any) => {
                const artCharges = (allArtworkCharges[art.id] || []).filter(
                  (c: any) => c.displayMode !== "subtract_from_margin",
                );
                const locationLabel = art.location
                  ? getImprintLocationLabel(art.location)
                  : "";
                return artCharges.map((c: any) => {
                  const price = parseFloat(c.retailPrice || "0");
                  const qty =
                    c.chargeCategory === "run" ? quantity : c.quantity || 1;
                  const chargeLabel =
                    c.chargeCategory === "run" ? "Imprint Cost" : "Setup Cost";
                  return (
                    <View
                      key={c.id}
                      style={[
                        styles.tableRow,
                        {
                          paddingHorizontal: 6,
                          backgroundColor: colors.gray100,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colItem,
                          styles.muted,
                        ]}
                      >
                        {chargeLabel}
                        {locationLabel ? ` - ${locationLabel}` : ""}
                      </Text>
                      <Text style={[styles.tableCell, styles.colQty]}>
                        {qty}
                      </Text>
                      <Text style={[styles.tableCell, styles.colPrice]}>
                        {fmtMoney(price)}
                      </Text>
                      <Text style={[styles.tableCell, styles.colAmount]}>
                        {fmtMoney(price * qty)}
                      </Text>
                    </View>
                  );
                });
              })}
            </View>
          );
        })}

        {/* Service charges as rows in the same table */}
        {clientServiceCharges.map((charge: any) => {
          const qty = charge.quantity || 1;
          const price = parseFloat(charge.unitPrice || "0");
          return (
            <View
              key={charge.id}
              style={[styles.tableRow, { paddingHorizontal: 6 }]}
            >
              <Text style={[styles.tableCell, styles.colItem, styles.bold]}>
                {charge.description || charge.chargeType}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>{qty}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {fmtMoney(price)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                {fmtMoney(qty * price)}
              </Text>
            </View>
          );
        })}

        {/* ── Footer: Totals ───────────────────────────────────── */}
        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>SUBTOTAL</Text>
              <Text>{fmtMoney(subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>TAX{taxExempt ? " (Exempt)" : taxRate > 0 ? ` (${taxRate}%)` : ""}</Text>
              <Text>{fmtMoney(tax)}</Text>
            </View>
            {shipping > 0 && (
              <View style={styles.totalsRow}>
                <Text>SHIPPING</Text>
                <Text>{fmtMoney(shipping)}</Text>
              </View>
            )}
            <View style={[styles.totalsGrandRow, { color: colors.gray800 }]}>
              <Text>TOTAL</Text>
              <Text>{fmtMoney(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes / Terms ────────────────────────────────────── */}
        {(invoice?.notes || order?.notes) && (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesLabel}>TERMS & CONDITIONS</Text>
            <Text style={styles.notesText}>
              {invoice?.notes || order?.notes}
            </Text>
          </View>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        <View style={styles.pageFooter} fixed>
          <Text>
            Thank you for your business! Please remit payment by the due date
            shown above.
          </Text>
          <Text style={{ marginTop: 2 }}>Generated by SwagSuite</Text>
        </View>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
