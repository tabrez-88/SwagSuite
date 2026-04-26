import type { EnrichedOrderItem, OrderVendor } from "@/types/project-types";
import type { OrderItemLine } from "@shared/schema";

/** Fields that differentiate PO groups within the same vendor */
interface POGroupKey {
  vendorId: string;
  vendorRole: "supplier" | "decorator";
  addressHash: string;
  shipInHandsDate: string | null;
  shipFirm: boolean | null;
  shippingMethod: string | null;
  shippingAccountId: string | null;
}

export interface POGroup {
  groupKey: string;
  vendor: OrderVendor;
  items: EnrichedOrderItem[];
  lines: Record<string, OrderItemLine[]>;
  totalQty: number;
  totalCost: number;
  /** Label for the card subtitle showing differentiator */
  label: string;
  // Shared shipping values from items
  shipToAddress: Record<string, unknown> | null;
  shipInHandsDate: string | null;
  shipFirm: boolean | null;
  shippingMethod: string | null;
  shippingAccountId: string | null;
}

/** Deterministic hash from address snapshot for grouping */
function hashAddress(addr: unknown): string {
  if (!addr || typeof addr !== "object") return "no-address";
  const a = addr as Record<string, unknown>;
  const parts = [
    a.street ?? "",
    a.street2 ?? "",
    a.city ?? "",
    a.state ?? "",
    a.zipCode ?? "",
    a.country ?? "",
  ];
  return parts.join("|").toLowerCase().trim();
}

/** Build a deterministic group key from shipping-relevant fields */
function buildGroupKey(key: POGroupKey): string {
  return [
    key.vendorId,
    key.vendorRole,
    key.addressHash,
    key.shipInHandsDate ?? "null",
    String(key.shipFirm),
    key.shippingMethod ?? "null",
    key.shippingAccountId ?? "null",
  ].join(":::");
}

/** Format a date string for display (MM/DD) */
function shortDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}

/** Build a human-readable label for a group's differentiator */
function buildLabel(vendor: OrderVendor, item: EnrichedOrderItem): string {
  const parts: string[] = [vendor.name || "Unknown Vendor"];
  const addr = item.shipToAddress as Record<string, unknown> | null;
  if (addr?.city && addr?.state) {
    parts.push(`${addr.city}, ${addr.state}`);
  }
  const ihd = item.shipInHandsDate as unknown as string | null;
  if (ihd) parts.push(`IHD ${shortDate(ihd)}`);
  return parts.join(" \u2014 ");
}

/**
 * Compute PO groups from order items and vendor list.
 * Items with identical group key (vendor + address + dates + method + account) → same PO.
 * Different → separate POs.
 */
export function computePOGroups(
  orderItems: EnrichedOrderItem[],
  orderVendors: OrderVendor[],
  allItemLines: Record<string, OrderItemLine[]>,
  allArtworkItems?: Record<string, unknown[]>,
  allArtworkCharges?: Record<string, unknown[]>,
  order?: { isFirm?: boolean | null } | null,
): POGroup[] {
  const groupMap = new Map<string, POGroup>();

  for (const vendor of orderVendors) {
    const isDecorator = vendor.role === "decorator";
    const vendorItems = isDecorator
      ? orderItems.filter((i) => i.decoratorType === "third_party" && i.decoratorId === vendor.id)
      : orderItems.filter((i) => i.supplierId === vendor.id);

    for (const item of vendorItems) {
      const key = buildGroupKey({
        vendorId: vendor.id,
        vendorRole: isDecorator ? "decorator" : "supplier",
        addressHash: hashAddress(item.shipToAddress),
        shipInHandsDate: item.shipInHandsDate
          ? new Date(item.shipInHandsDate as unknown as string).toISOString().slice(0, 10)
          : null,
        shipFirm: (item.shipFirm as boolean | null) ?? order?.isFirm ?? false,
        shippingMethod: (item.shippingMethodOverride as string) || null,
        shippingAccountId: (item.shippingAccountId as string) || null,
      });

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupKey: key,
          vendor,
          items: [],
          lines: {},
          totalQty: 0,
          totalCost: 0,
          label: buildLabel(vendor, item),
          shipToAddress: (item.shipToAddress as Record<string, unknown>) || null,
          shipInHandsDate: item.shipInHandsDate
            ? new Date(item.shipInHandsDate as unknown as string).toISOString().slice(0, 10)
            : null,
          shipFirm: (item.shipFirm as boolean | null) ?? order?.isFirm ?? false,
          shippingMethod: (item.shippingMethodOverride as string) || null,
          shippingAccountId: (item.shippingAccountId as string) || null,
        });
      }

      const group = groupMap.get(key)!;
      group.items.push(item);
      group.lines[item.id] = allItemLines[item.id] || [];

      // Accumulate totals
      if (isDecorator) {
        const itemArts = allArtworkItems?.[item.id] || [];
        for (const art of itemArts) {
          const artId = (art as Record<string, unknown>).id as string;
          const charges = (allArtworkCharges?.[artId] || []) as Record<string, unknown>[];
          for (const c of charges) {
            const cost = parseFloat((c.netCost as string) || "0");
            const category = c.chargeCategory as string;
            const qty = category === "run" ? (item.quantity || 1) : ((c.quantity as number) || 1);
            group.totalCost += cost * qty;
          }
        }
        group.totalQty += item.quantity || 0;
      } else {
        const itemLines = allItemLines[item.id] || [];
        if (itemLines.length > 0) {
          for (const l of itemLines) {
            const qty = l.quantity || 0;
            const cost = parseFloat(l.cost || "0");
            group.totalQty += qty;
            group.totalCost += qty * cost;
          }
        } else {
          const qty = item.quantity || 0;
          const cost = parseFloat(item.cost || item.unitPrice || "0");
          group.totalQty += qty;
          group.totalCost += qty * cost;
        }
      }
    }
  }

  // Sort: by vendor name, then by first product name for easy scanning
  const groups = Array.from(groupMap.values());
  groups.sort((a, b) => {
    const vendorCmp = (a.vendor.name || "").localeCompare(b.vendor.name || "");
    if (vendorCmp !== 0) return vendorCmp;
    const aProduct = a.items[0]?.productName || "";
    const bProduct = b.items[0]?.productName || "";
    return aProduct.localeCompare(bProduct);
  });
  return groups;
}
