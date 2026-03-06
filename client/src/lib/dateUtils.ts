import { differenceInCalendarDays, format, startOfDay } from "date-fns";

// ── Types ──

export type DateUrgency = "overdue" | "today" | "urgent" | "soon" | "normal";

export interface DateStatus {
  urgency: DateUrgency;
  label: string;
  color: string; // tailwind classes
  daysRemaining: number;
}

export interface TimelineConflict {
  type: "supplier_after_customer" | "event_before_inHands" | "shipment_after_inHands" | "no_shipping_address";
  message: string;
  severity: "error" | "warning";
}

// ── Date Status ──

export function getDateStatus(date: string | Date | null | undefined): DateStatus | null {
  if (!date) return null;

  const target = startOfDay(new Date(date));
  const today = startOfDay(new Date());
  const days = differenceInCalendarDays(target, today);

  if (days < 0) {
    return {
      urgency: "overdue",
      label: "Overdue",
      color: "bg-red-100 text-red-800",
      daysRemaining: days,
    };
  }
  if (days === 0) {
    return {
      urgency: "today",
      label: "Due Today",
      color: "bg-red-100 text-red-700",
      daysRemaining: 0,
    };
  }
  if (days <= 3) {
    return {
      urgency: "urgent",
      label: `${days}d left`,
      color: "bg-orange-100 text-orange-800",
      daysRemaining: days,
    };
  }
  if (days <= 7) {
    return {
      urgency: "soon",
      label: `${days}d left`,
      color: "bg-yellow-100 text-yellow-800",
      daysRemaining: days,
    };
  }
  return null; // normal — no badge needed
}

// ── Timeline Conflict Detection ──

export function hasTimelineConflict(
  order: any,
  shipments?: any[],
): TimelineConflict[] {
  const conflicts: TimelineConflict[] = [];
  const inHands = order?.inHandsDate ? new Date(order.inHandsDate) : null;

  // Supplier in-hands date is after customer in-hands date
  if (inHands && order?.supplierInHandsDate) {
    const supplierDate = new Date(order.supplierInHandsDate);
    if (supplierDate > inHands) {
      conflicts.push({
        type: "supplier_after_customer",
        message: `Supplier deadline (${format(supplierDate, "MMM d")}) is after customer in-hands date (${format(inHands, "MMM d")})`,
        severity: "error",
      });
    }
  }

  // Event date is before in-hands date (items won't be ready in time)
  if (inHands && order?.eventDate) {
    const eventDate = new Date(order.eventDate);
    if (eventDate < inHands) {
      conflicts.push({
        type: "event_before_inHands",
        message: `Event date (${format(eventDate, "MMM d")}) is before in-hands date (${format(inHands, "MMM d")}) — items may not arrive in time`,
        severity: "warning",
      });
    }
  }

  // Shipment ETA exceeds in-hands date
  if (inHands && shipments) {
    for (const s of shipments) {
      if (s.estimatedDelivery && s.status !== "delivered") {
        const eta = new Date(s.estimatedDelivery);
        if (eta > inHands) {
          conflicts.push({
            type: "shipment_after_inHands",
            message: `Shipment ETA (${format(eta, "MMM d")}) exceeds customer in-hands date (${format(inHands, "MMM d")})`,
            severity: "error",
          });
        }
      }
    }
  }

  return conflicts;
}

// ── Invoice Overdue Check ──

export function isInvoiceOverdue(invoice: any): boolean {
  if (!invoice || invoice.status !== "pending" || !invoice.dueDate) return false;
  return new Date(invoice.dueDate) < startOfDay(new Date());
}
