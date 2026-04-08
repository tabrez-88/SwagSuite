/**
 * Document element builders.
 *
 * Hooks are written in plain `.ts` files (no JSX), but they need a way to
 * construct react-pdf `<Document>` elements to pass to `useDocumentGeneration`
 * and `PdfPreviewDialog`. These builder functions wrap the JSX-based PDF
 * components and expose a plain function call that any `.ts` file can use.
 */
import type { ReactElement } from "react";
import { QuotePdf, type QuotePdfProps } from "./QuotePdf";
import { SalesOrderPdf, type SalesOrderPdfProps } from "./SalesOrderPdf";
import { PurchaseOrderPdf, type PurchaseOrderPdfProps } from "./PurchaseOrderPdf";
import { InvoicePdf, type InvoicePdfProps } from "./InvoicePdf";

export function buildQuotePdf(props: QuotePdfProps): ReactElement {
  return <QuotePdf {...props} />;
}

export function buildSalesOrderPdf(props: SalesOrderPdfProps): ReactElement {
  return <SalesOrderPdf {...props} />;
}

export function buildPurchaseOrderPdf(props: PurchaseOrderPdfProps): ReactElement {
  return <PurchaseOrderPdf {...props} />;
}

export function buildInvoicePdf(props: InvoicePdfProps): ReactElement {
  return <InvoicePdf {...props} />;
}
