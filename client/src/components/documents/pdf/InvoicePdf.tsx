/**
 * Invoice PDF — react-pdf rewrite of InvoiceTemplate.tsx.
 *
 * Purple accent. Includes a "PAST DUE" badge when invoice is overdue and a
 * payment-terms summary row. Items wrap as a single block per row so a long
 * invoice paginates without splitting a row across pages.
 */
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import { fmtMoney, fmtDate, parseAddress, resolvePdfImage } from "./helpers";

export interface InvoicePdfProps {
  invoice: any;
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
  serviceCharges?: any[];
  sellerName?: string;
}

export function InvoicePdf({
  invoice,
  order,
  orderItems,
  companyName,
  primaryContact,
  serviceCharges = [],
  sellerName,
}: InvoicePdfProps) {
  const billingAddr = parseAddress(order?.billingAddress);
  const shippingAddr = parseAddress(order?.shippingAddress);

  const subtotal = orderItems.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.totalPrice) || 0),
    0
  );
  const shipping = parseFloat(order?.shippingCost) || parseFloat(order?.shipping) || 0;
  const tax = parseFloat(invoice?.taxAmount) || parseFloat(order?.tax) || 0;
  const clientServiceCharges = serviceCharges.filter((c: any) => c.displayToClient !== false);
  const serviceChargesTotal = clientServiceCharges.reduce(
    (sum: number, c: any) => sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0"),
    0
  );
  const grossSubtotal = subtotal + serviceChargesTotal;
  const total = parseFloat(invoice?.totalAmount) || grossSubtotal + shipping + tax;

  return (
    <Document title={`Invoice ${invoice?.invoiceNumber || ""}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={[styles.docTitle, { color: colors.blue600 }]}>INVOICE</Text>
            <Text style={styles.docMeta}>Invoice #{invoice?.invoiceNumber || "N/A"}</Text>
            <Text style={styles.docMeta}>Order #{order?.orderNumber || "N/A"}</Text>
            <Text style={styles.docMeta}>Date: {fmtDate(invoice?.createdAt)}</Text>
            {invoice?.dueDate && (
              <Text style={[styles.docMeta, styles.bold]}>
                Due Date: {fmtDate(invoice.dueDate)}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.brandName}>{sellerName || "SwagSuite"}</Text>
            <Text style={styles.brandSub}>Your Promotional Products Partner</Text>
            {invoice?.status === "overdue" && (
              <View style={[styles.badge, styles.badgeRed, { marginTop: 6 }]}>
                <Text>PAST DUE</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Bill To / Ship To ────────────────────────────────── */}
        <View style={styles.addressGrid}>
          <View style={styles.addressCol}>
            <Text style={styles.addressLabel}>BILL TO</Text>
            <Text style={[styles.addressLine, styles.bold]}>{companyName || "N/A"}</Text>
            {primaryContact && (
              <Text style={styles.addressLine}>
                {primaryContact.firstName} {primaryContact.lastName}
              </Text>
            )}
            {primaryContact?.email && <Text style={styles.addressLine}>{primaryContact.email}</Text>}
            {billingAddr?.street && <Text style={styles.addressLine}>{billingAddr.street}</Text>}
            {(billingAddr?.city || billingAddr?.state) && (
              <Text style={styles.addressLine}>
                {[billingAddr.city, billingAddr.state].filter(Boolean).join(", ")}{" "}
                {billingAddr.zipCode || billingAddr.zip || ""}
              </Text>
            )}
          </View>
          <View style={styles.addressCol}>
            <Text style={styles.addressLabel}>SHIP TO</Text>
            {shippingAddr ? (
              <>
                {shippingAddr.name && (
                  <Text style={[styles.addressLine, styles.bold]}>{shippingAddr.name}</Text>
                )}
                {shippingAddr.street && <Text style={styles.addressLine}>{shippingAddr.street}</Text>}
                {(shippingAddr.city || shippingAddr.state) && (
                  <Text style={styles.addressLine}>
                    {[shippingAddr.city, shippingAddr.state].filter(Boolean).join(", ")}{" "}
                    {shippingAddr.zipCode || shippingAddr.zip || ""}
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.addressLine, styles.muted]}>Same as billing</Text>
            )}
          </View>
        </View>

        {/* ── Payment summary strip ────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.purple50,
            borderColor: colors.purple200,
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 3,
            padding: 8,
            marginBottom: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.tiny, styles.muted]}>Payment Terms</Text>
            <Text style={{ fontSize: 9 }}>
              {order?.paymentTerms
                ? order.paymentTerms.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
                : "Net 30"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tiny, styles.muted]}>Status</Text>
            <Text
              style={{
                fontSize: 9,
                color:
                  invoice?.status === "paid"
                    ? colors.green600
                    : invoice?.status === "overdue"
                      ? colors.red600
                      : colors.amber700,
              }}
            >
              {(invoice?.status || "pending")
                .charAt(0)
                .toUpperCase() + (invoice?.status || "pending").slice(1)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tiny, styles.muted]}>Amount Due</Text>
            <Text style={[styles.bold, { fontSize: 10 }]}>{fmtMoney(total)}</Text>
          </View>
        </View>

        {/* ── Items ────────────────────────────────────────────── */}
        <View style={[styles.tableHead, { backgroundColor: colors.blue600, padding: 6 }]}>
          <Text style={[styles.tableHeadCell, styles.colItem, { color: colors.white }]}>ITEM</Text>
          <Text style={[styles.tableHeadCell, styles.colQty, { color: colors.white }]}>QTY</Text>
          <Text style={[styles.tableHeadCell, styles.colPrice, { color: colors.white }]}>UNIT PRICE</Text>
          <Text style={[styles.tableHeadCell, styles.colAmount, { color: colors.white }]}>AMOUNT</Text>
        </View>
        {orderItems.map((item: any, idx: number) => {
          const product = item.product || {};
          const imageUrl = product.imageUrl || item.imageUrl;
          const imgSrc = resolvePdfImage(imageUrl);
          return (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { padding: 6, backgroundColor: idx % 2 === 0 ? colors.white : colors.gray100 },
              ]}
              wrap={false}
            >
              <View style={[styles.colItem, { flexDirection: "row", gap: 6 }]}>
                {imgSrc && (
                  <Image
                    src={imgSrc}
                    style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 2 }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray900 }}>
                    {product.name || item.productName || item.name || "Product"}
                  </Text>
                  {(product.sku || item.sku) && (
                    <Text style={[styles.tiny, styles.muted]}>SKU: {product.sku || item.sku}</Text>
                  )}
                  {item.color && <Text style={[styles.tiny, styles.muted]}>Color: {item.color}</Text>}
                  {item.size && <Text style={[styles.tiny, styles.muted]}>Size: {item.size}</Text>}
                </View>
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {fmtMoney(parseFloat(item.unitPrice || "0"))}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount, styles.bold]}>
                {fmtMoney(parseFloat(item.totalPrice || "0"))}
              </Text>
            </View>
          );
        })}

        {/* ── Service charges ──────────────────────────────────── */}
        {clientServiceCharges.length > 0 && (
          <View style={{ marginTop: 8, marginBottom: 8 }} wrap={false}>
            <Text style={[styles.notesLabel, { marginBottom: 4 }]}>Services & Fees</Text>
            {clientServiceCharges.map((charge: any, idx: number) => {
              const qty = charge.quantity || 1;
              const price = parseFloat(charge.unitPrice || "0");
              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colItem]}>
                    {charge.description || charge.chargeType}
                  </Text>
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
              <Text>{fmtMoney(grossSubtotal)}</Text>
            </View>
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
            <View style={[styles.totalsGrandRow, { color: colors.blue600 }]}>
              <Text>Total Due:</Text>
              <Text>{fmtMoney(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ────────────────────────────────────────────── */}
        {(invoice?.notes || order?.notes) && (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <Text style={styles.notesText}>{invoice?.notes || order?.notes}</Text>
          </View>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <View style={styles.pageFooter} fixed>
          <Text>Thank you for your business! Please remit payment by the due date shown above.</Text>
          <Text style={{ marginTop: 2 }}>Generated by SwagSuite</Text>
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
