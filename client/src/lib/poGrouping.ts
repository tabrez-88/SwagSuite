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
  allItemCharges?: Record<string, Array<Record<string, unknown>>>,
): POGroup[] {
  const groupMap = new Map<string, POGroup>();

  for (const vendor of orderVendors) {
    const isDecorator = vendor.role === "decorator";
    const vendorItems = isDecorator
      ? orderItems.filter((i) => i.decoratorType === "third_party" && i.decoratorId === vendor.id)
      : orderItems.filter((i) => i.supplierId === vendor.id);

    for (const item of vendorItems) {
      // Decorator PO = leg 2 (decorator→client), so use leg2 address/date
      // Supplier PO = leg 1 (supplier→destination), use shipTo address/date
      const effectiveAddress = isDecorator
        ? (item.leg2Address as Record<string, unknown>) || (item.shipToAddress as Record<string, unknown>) || null
        : (item.shipToAddress as Record<string, unknown>) || null;
      const rawIhd = isDecorator
        ? (item.leg2InHandsDate as unknown as string) || (item.shipInHandsDate as unknown as string) || null
        : (item.shipInHandsDate as unknown as string) || null;
      const effectiveIhd = rawIhd
        ? new Date(rawIhd).toISOString().slice(0, 10)
        : null;
      const effectiveFirm = isDecorator
        ? (item.leg2Firm as boolean | null) ?? (item.shipFirm as boolean | null) ?? order?.isFirm ?? false
        : (item.shipFirm as boolean | null) ?? order?.isFirm ?? false;
      const effectiveMethod = isDecorator
        ? (item.leg2ShippingMethod as string) || null
        : (item.shippingMethodOverride as string) || null;
      const effectiveAccountId = isDecorator
        ? (item.leg2ShippingAccountId as string) || null
        : (item.shippingAccountId as string) || null;

      const key = buildGroupKey({
        vendorId: vendor.id,
        vendorRole: isDecorator ? "decorator" : "supplier",
        addressHash: hashAddress(effectiveAddress),
        shipInHandsDate: effectiveIhd,
        shipFirm: effectiveFirm,
        shippingMethod: effectiveMethod,
        shippingAccountId: effectiveAccountId,
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
          shipToAddress: effectiveAddress,
          shipInHandsDate: effectiveIhd,
          shipFirm: effectiveFirm,
          shippingMethod: effectiveMethod,
          shippingAccountId: effectiveAccountId,
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

        // Item charges (setup, run charges) for supplier POs
        const charges = allItemCharges?.[item.id] || [];
        for (const c of charges) {
          const cost = parseFloat((c.netCost as string) || (c.amount as string) || "0");
          if (c.chargeCategory === "run") {
            group.totalCost += cost * (item.quantity || 1);
          } else {
            group.totalCost += cost * ((c.quantity as number) || 1);
          }
        }

        // Artwork charges on supplier PO ONLY if item has no third_party decorator
        if (item.decoratorType !== "third_party") {
          const itemArts = allArtworkItems?.[item.id] || [];
          for (const art of itemArts) {
            const artId = (art as Record<string, unknown>).id as string;
            const artCharges = (allArtworkCharges?.[artId] || []) as Record<string, unknown>[];
            for (const c of artCharges) {
              const cost = parseFloat((c.netCost as string) || "0");
              const category = c.chargeCategory as string;
              const qty = category === "run" ? (item.quantity || 1) : ((c.quantity as number) || 1);
              group.totalCost += cost * qty;
            }
          }
        }
      }
    }
  }

  // Sort: pair supplier PO with its decorator PO so they appear adjacent.
  // Strategy: group by shared item IDs, supplier first then decorator.
  const groups = Array.from(groupMap.values());

  // Build a map: item ID → supplier group key (for linking decorator groups to their supplier counterpart)
  const itemToSupplierGroup = new Map<string, string>();
  for (const g of groups) {
    if (g.vendor.role !== "decorator") {
      for (const item of g.items) {
        itemToSupplierGroup.set(item.id, g.groupKey);
      }
    }
  }

  // For each decorator group, find the supplier group that shares the most items
  const decoratorToSupplier = new Map<string, string>();
  for (const g of groups) {
    if (g.vendor.role === "decorator") {
      // Find supplier groups for each item in this decorator group
      const supplierKeys = new Map<string, number>();
      for (const item of g.items) {
        const sk = itemToSupplierGroup.get(item.id);
        if (sk) supplierKeys.set(sk, (supplierKeys.get(sk) || 0) + 1);
      }
      // Pick the supplier group with most shared items
      let bestKey = "";
      let bestCount = 0;
      for (const [k, c] of supplierKeys) {
        if (c > bestCount) { bestKey = k; bestCount = c; }
      }
      if (bestKey) decoratorToSupplier.set(g.groupKey, bestKey);
    }
  }

  // Build ordered list: supplier groups sorted by vendor name, each followed by its decorator groups
  const supplierGroups = groups.filter((g) => g.vendor.role !== "decorator");
  supplierGroups.sort((a, b) => {
    const vendorCmp = (a.vendor.name || "").localeCompare(b.vendor.name || "");
    if (vendorCmp !== 0) return vendorCmp;
    return (a.items[0]?.productName || "").localeCompare(b.items[0]?.productName || "");
  });

  const decoratorGroups = groups.filter((g) => g.vendor.role === "decorator");
  const usedDecorators = new Set<string>();
  const sorted: POGroup[] = [];

  for (const sg of supplierGroups) {
    sorted.push(sg);
    // Append decorator groups linked to this supplier group
    const linkedDecs = decoratorGroups.filter(
      (dg) => decoratorToSupplier.get(dg.groupKey) === sg.groupKey,
    );
    linkedDecs.sort((a, b) =>
      (a.items[0]?.productName || "").localeCompare(b.items[0]?.productName || ""),
    );
    for (const dg of linkedDecs) {
      sorted.push(dg);
      usedDecorators.add(dg.groupKey);
    }
  }

  // Append any decorator groups not linked to a supplier (edge case)
  for (const dg of decoratorGroups) {
    if (!usedDecorators.has(dg.groupKey)) sorted.push(dg);
  }

  return sorted;
}
