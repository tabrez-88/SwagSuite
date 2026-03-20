import {
  CheckCircle2, Clock, Package, Truck, AlertCircle,
} from "lucide-react";

/* ── Interfaces ── */

export interface PortalOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  inHandsDate: string | null;
  eventDate: string | null;
  shippingAddress: string | null;
  customerNotes: string | null;
  customerPo: string | null;
  createdAt: string;
}

export interface PortalItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  color: string | null;
  size: string | null;
  imprintMethod: string | null;
  imprintLocation: string | null;
  notes: string | null;
}

export interface PortalShipment {
  id: string;
  carrier: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  shippingCost: string | null;
  shipDate: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  status: string | null;
  notes: string | null;
}

export interface PortalData {
  order: PortalOrder;
  items: PortalItem[];
  shipments: PortalShipment[];
}

/* ── Constants ── */

export const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  quote: { label: "Quote", color: "bg-blue-100 text-blue-800", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  in_production: { label: "In Production", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

export const PROGRESS_STEPS = ["quote", "approved", "in_production", "shipped", "delivered"] as const;

/* ── Helpers ── */

export function getTrackingUrl(carrier: string | null, tracking: string | null) {
  if (!tracking) return null;
  const c = (carrier || "").toLowerCase();
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  if (c.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${tracking}`;
  return null;
}

export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
