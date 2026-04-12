/**
 * Small pure helpers shared by every react-pdf document.
 *
 * Image handling note:
 * react-pdf in the browser fetches `<Image src>` URLs through the standard
 * `fetch()` API. Same-origin URLs (e.g. `/api/image-proxy?url=...`) inherit
 * the session cookie automatically, so we route every external URL through
 * the existing image proxy. PDFs / SVGs / unsupported types are filtered out
 * via `isPdfRenderable` so the renderer never crashes on a non-image asset.
 */
import { format } from "date-fns";
import { proxyImg } from "@/lib/imageUtils";

/** Format a number as USD currency. */
export const fmtMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return `$${(v || 0).toFixed(2)}`;
};

/** Format a date or ISO string for display, returning fallback when missing. */
export const fmtDate = (
  d: Date | string | null | undefined,
  pattern = "MMMM dd, yyyy",
  fallback = "N/A"
): string => {
  if (!d) return fallback;
  try {
    return format(new Date(d), pattern);
  } catch {
    return fallback;
  }
};

/** Safely parse a JSON address blob to an object. */
export const parseAddress = (raw: string | null | undefined): any => {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

/**
 * Determine whether a URL points at an asset react-pdf can render as an
 * image (JPEG, PNG, GIF). Cloudinary `/image/upload/` paths always serve
 * an image; PDFs and other extensions are skipped.
 */
export const isRenderablePdfImage = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(jpe?g|png|gif|webp)$/i.test(lower)) return true;
  if (lower.includes("/image/upload/")) return true;
  return false;
};

/**
 * Resolve any URL into a string that the react-pdf `<Image>` component can
 * fetch. External hosts are funneled through the same-origin proxy so the
 * browser sends our session cookie automatically.
 */
export const resolvePdfImage = (url: string | null | undefined): string | null => {
  if (!isRenderablePdfImage(url)) return null;
  // For Cloudinary design-file transforms (f_png from .ai/.eps/.psd), force JPG + white bg
  // so react-pdf renders solid colors instead of washed-out transparent PNG.
  let resolved = url!;
  if (resolved.includes("cloudinary.com") && resolved.includes("f_png,pg_1")) {
    resolved = resolved.replace("f_png,pg_1,cs_srgb", "f_jpg,pg_1,cs_srgb,b_white")
                       .replace("f_png,pg_1", "f_jpg,pg_1,b_white");
  }
  return proxyImg(resolved);
};

/** Pretty-print a payment-terms slug like `net_30` → `Net 30`. */
export const formatPaymentTerms = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Build a comma-joined `City, State Zip` line from a parsed address. */
export const formatCityLine = (addr: any): string => {
  if (!addr) return "";
  return [addr.city, addr.state, addr.zipCode || addr.zip].filter(Boolean).join(", ");
};
