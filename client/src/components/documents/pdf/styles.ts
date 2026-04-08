/**
 * Shared StyleSheet for react-pdf documents.
 *
 * react-pdf uses Yoga (flexbox) layout + a CSS-in-JS-style API. It does NOT
 * understand Tailwind class names — every visual rule must live here as a
 * StyleSheet object. The values below mirror the Tailwind tokens we used in
 * the old html2canvas templates so the rendered output looks identical.
 *
 * To add a custom font, register it with `Font.register({ family, fonts: [...] })`
 * and switch `fontFamily` below from "Helvetica" (built-in PDF core font).
 */
import { StyleSheet } from "@react-pdf/renderer";

// ─── Color tokens (mirror Tailwind) ─────────────────────────────────
export const colors = {
  white: "#ffffff",
  // gray
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  // accent
  blue50: "#eff6ff",
  blue100: "#dbeafe",
  blue600: "#2563eb",
  blue700: "#1d4ed8",
  blue800: "#1e40af",
  emerald600: "#059669",
  green600: "#16a34a",
  red100: "#fee2e2",
  red600: "#dc2626",
  red700: "#b91c1c",
  red800: "#991b1b",
  amber50: "#fffbeb",
  amber200: "#fde68a",
  amber700: "#b45309",
  purple50: "#faf5ff",
  purple200: "#e9d5ff",
  purple600: "#9333ea",
  purple700: "#7e22ce",
};

// ─── Page geometry ──────────────────────────────────────────────────
// A4 = 595 × 842 pt at 72 dpi. We use a 32pt margin (~11mm) all around.
export const PAGE_MARGIN = 32;

// ─── Shared StyleSheet ──────────────────────────────────────────────
export const styles = StyleSheet.create({
  // page wrapper
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.gray800,
    paddingTop: PAGE_MARGIN,
    paddingBottom: PAGE_MARGIN + 20, // extra room for footer
    paddingLeft: PAGE_MARGIN,
    paddingRight: PAGE_MARGIN,
    backgroundColor: colors.white,
  },

  // ─── Header ───────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray300,
    borderBottomStyle: "solid",
  },
  headerLeft: { flexDirection: "column" },
  headerRight: { flexDirection: "column", alignItems: "flex-end" },
  docTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 9,
    color: colors.gray700,
    marginBottom: 1,
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  brandSub: {
    fontSize: 9,
    color: colors.gray600,
  },

  // ─── Generic typography ───────────────────────────────────────────
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  small: { fontSize: 8 },
  tiny: { fontSize: 7 },
  muted: { color: colors.gray500 },
  mutedDark: { color: colors.gray700 },
  textRight: { textAlign: "right" },
  textCenter: { textAlign: "center" },

  // ─── Address blocks ───────────────────────────────────────────────
  addressGrid: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 24,
  },
  addressCol: { flex: 1 },
  addressLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray800,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.4,
  },

  // ─── Line item rows ───────────────────────────────────────────────
  itemBlock: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    borderBottomStyle: "solid",
  },
  itemTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.gray900,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    borderBottomStyle: "solid",
  },
  itemDesc: {
    fontSize: 8,
    color: colors.gray600,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  itemNotes: {
    fontSize: 8,
    color: colors.gray500,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 6,
  },
  itemBody: {
    flexDirection: "row",
    gap: 12,
  },
  productImageBox: {
    width: 110,
    flexShrink: 0,
  },
  productImage: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: "solid",
    borderRadius: 2,
    objectFit: "contain",
  },
  imageCaption: {
    fontSize: 6,
    color: colors.gray400,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    marginTop: 2,
  },
  itemTableWrap: { flex: 1 },

  // ─── Tables ───────────────────────────────────────────────────────
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    borderBottomStyle: "solid",
    paddingVertical: 3,
  },
  tableHeadCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    borderBottomStyle: "solid",
    paddingVertical: 3,
  },
  tableTotalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    borderTopStyle: "solid",
    paddingVertical: 3,
  },
  tableCell: {
    fontSize: 8,
    color: colors.gray800,
  },
  // column widths (sums = 1)
  colItem: { flex: 0.55 },
  colQty: { width: 40, textAlign: "center" },
  colPrice: { width: 50, textAlign: "right" },
  colAmount: { width: 60, textAlign: "right" },

  // ─── Artwork details ──────────────────────────────────────────────
  artworkBlock: {
    marginTop: 8,
  },
  artworkHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray900,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    borderBottomStyle: "solid",
  },
  artworkRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  artworkFields: { flex: 1 },
  artworkFieldRow: {
    flexDirection: "row",
    paddingVertical: 1,
  },
  artworkFieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray800,
    width: 90,
  },
  artworkFieldValue: {
    fontSize: 7,
    color: colors.gray700,
    flex: 1,
  },
  artworkThumb: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: "solid",
    borderRadius: 2,
    objectFit: "contain",
  },

  // ─── Totals box ───────────────────────────────────────────────────
  totalsWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 16,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 9,
  },
  totalsGrandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: colors.gray300,
    borderTopStyle: "solid",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },

  // ─── Notes / Footer ───────────────────────────────────────────────
  notesBlock: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    borderTopStyle: "solid",
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray800,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.4,
  },
  pageFooter: {
    position: "absolute",
    bottom: PAGE_MARGIN / 2,
    left: PAGE_MARGIN,
    right: PAGE_MARGIN,
    textAlign: "center",
    fontSize: 7,
    color: colors.gray500,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    borderTopStyle: "solid",
  },
  pageNumber: {
    position: "absolute",
    bottom: PAGE_MARGIN / 2,
    right: PAGE_MARGIN,
    fontSize: 7,
    color: colors.gray400,
  },

  // ─── Pills / Badges ───────────────────────────────────────────────
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  badgeBlue: {
    backgroundColor: colors.blue100,
    color: colors.blue800,
  },
  badgeRed: {
    backgroundColor: colors.red100,
    color: colors.red800,
  },
});
