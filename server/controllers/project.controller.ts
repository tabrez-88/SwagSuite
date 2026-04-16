import type { Request, Response } from "express";
import { projectRepository } from "../repositories/project.repository";
import { userRepository } from "../repositories/user.repository";
import { activityRepository } from "../repositories/activity.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import {
  insertOrderSchema,
  insertOrderItemSchema,
  insertOrderItemLineSchema,
  insertOrderAdditionalChargeSchema,
} from "@shared/schema";
import { isSectionLocked, checkLockByOrderItemId } from "../utils/lockHelpers";
import { updateCompanyYtdSpending, updateSupplierYtdSpending } from "../utils/ytdHelpers";
import { registerInMediaLibrary } from "../utils/registerInMediaLibrary";

// Derive the stored artwork file name from the user-entered display name.
// If the user's name already includes an extension, use it verbatim; otherwise
// append the extension from the original uploaded/picked file so downstream
// email attachments and PDFs honor the extension.
function resolveArtworkFileName(userName: string | undefined | null, originalFileName: string | null): string | null {
  const name = typeof userName === "string" ? userName.trim() : "";
  if (!name) return originalFileName;
  if (/\.[A-Za-z0-9]{1,8}$/.test(name)) return name;
  const ext = originalFileName && /\.[A-Za-z0-9]{1,8}$/.test(originalFileName)
    ? originalFileName.slice(originalFileName.lastIndexOf("."))
    : "";
  return `${name}${ext}`;
}

// ── Helper: recalculate order totals (items + charges + discount + tax + shipping) ──
/**
 * Recalculate and persist all order totals.
 *
 * Pricing model (must match client/src/lib/pricing.ts):
 *
 *   itemsSubtotal       = SUM(orderItem.totalPrice)              [product lines only]
 *   additionalCharges   = SUM(charges visible to client where !includeInUnitPrice)
 *                           - Run charge:   getChargeSellPrice * itemQty
 *                           - Fixed charge: getChargeSellPrice * chargeQty
 *   artworkCharges      = SUM(decoration charges where displayMode = "display_to_client")
 *                           - Run charge:   retailPrice * itemQty
 *                           - Fixed charge: retailPrice * chargeQty
 *   serviceCharges      = SUM(unitPrice * qty) for displayToClient service charges
 *   subtotal            = itemsSubtotal + additionalCharges + artworkCharges + serviceCharges
 *   shippingTotal       = SUM(shipment.shippingCost)
 *   tax                 = calculated per tax code / TaxJar
 *   total               = subtotal + shippingTotal + tax
 *
 * See docs/pricing-calculation-spec.md for the full spec.
 */

/** Get the parent orderId from an order item id */
async function getOrderIdFromItemId(itemId: string): Promise<string | null> {
  const { db } = await import("../db");
  const { orderItems } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, itemId));
  return item?.orderId || null;
}

async function recalculateOrderTotals(orderId: string) {
  const { db } = await import("../db");
  const { orderServiceCharges, orderAdditionalCharges, orderShipments, companies, artworkItems, artworkCharges, taxCodes, integrationSettings } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const { getTaxJarCredentials } = await import("../services/taxjar.service");

  // ── Helper: get sell price (retailPrice takes priority over legacy amount field) ──
  const getChargeSellPrice = (c: { retailPrice?: string | null; amount?: string | null }) =>
    parseFloat(c.retailPrice || c.amount || "0");

  // ── Helper: effective qty for a charge (run = item qty, fixed = charge qty) ──
  const getChargeEffectiveQty = (
    c: { chargeCategory?: string | null; quantity?: number | null },
    itemQty: number,
  ) => (c.chargeCategory === "run" ? itemQty : (c.quantity || 1));

  // ── Step 1: Items subtotal (product lines only — totalPrice is qty × unitPrice from lines) ──
  const allItems = await projectRepository.getOrderItems(orderId);
  const itemsSubtotal = allItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  // ── Step 2: Additional charges (setup fees, etc.) ──
  // Batch fetch all additional charges for this order's items (instead of N+1)
  const { inArray } = await import("drizzle-orm");
  const itemIds = allItems.map(item => item.id);
  const allCharges = itemIds.length > 0
    ? await db.select().from(orderAdditionalCharges).where(inArray(orderAdditionalCharges.orderItemId, itemIds))
    : [];
  // Sell total: all revenue-generating charges ("include in price" + "display to client").
  // Only "subtract from margin" (displayToClient=false, includeInUnitPrice=false) is excluded.
  const additionalChargesTotal = allCharges
    .filter((c: any) => c.displayToClient !== false || c.includeInUnitPrice)
    .reduce((sum: number, c: any) => {
      const parentItem = allItems.find(i => i.id === c.orderItemId);
      const itemQty = parentItem?.quantity || 1;
      const sellPrice = getChargeSellPrice(c);
      const effectiveQty = getChargeEffectiveQty(c, itemQty);
      return sum + sellPrice * effectiveQty;
    }, 0);

  // ── Step 3: Artwork/decoration charges ──
  // Batch fetch artwork charges (per-artwork imprint/setup costs)
  const allArtworks = itemIds.length > 0
    ? await db.select().from(artworkItems).where(inArray(artworkItems.orderItemId, itemIds))
    : [];
  const artworkIds = allArtworks.map(a => a.id);
  const allArtCharges = artworkIds.length > 0
    ? await db.select().from(artworkCharges).where(inArray(artworkCharges.artworkItemId, artworkIds))
    : [];
  // All revenue-generating artwork charges (exclude only "subtract_from_margin")
  const artworkChargesTotal = allArtCharges
    .filter((c: any) => c.displayMode !== "subtract_from_margin")
    .reduce((sum: number, c: any) => {
      // Find parent item via artwork → orderItem
      const parentArtwork = allArtworks.find(a => a.id === c.artworkItemId);
      const parentItem = parentArtwork ? allItems.find(i => i.id === parentArtwork.orderItemId) : null;
      const itemQty = parentItem?.quantity || 1;
      const sellPrice = parseFloat(c.retailPrice || "0");
      const effectiveQty = getChargeEffectiveQty(c, itemQty);
      return sum + sellPrice * effectiveQty;
    }, 0);

  // ── Step 4: Order-level service charges (freight, fulfillment, etc.) ──
  // Treat null/undefined displayToClient as visible (matches PDF render + additionalCharges filter)
  const serviceCharges = await db.select().from(orderServiceCharges).where(eq(orderServiceCharges.orderId, orderId));
  const serviceChargesTotal = serviceCharges
    .filter((c: any) => c.displayToClient !== false)
    .reduce((sum: number, c: any) => {
      const qty = c.quantity || 1;
      const price = parseFloat(c.unitPrice || "0");
      return sum + qty * price;
    }, 0);

  // ── Step 5: Shipping ──
  const shipments = await db.select().from(orderShipments).where(eq(orderShipments.orderId, orderId));
  const shippingTotal = shipments.reduce((sum: number, s: any) => sum + parseFloat(s.shippingCost || "0"), 0);

  // ── Step 6: Subtotal (everything except tax + shipping) ──
  const subtotal = itemsSubtotal + additionalChargesTotal + serviceChargesTotal + artworkChargesTotal;
  const existingOrder = await projectRepository.getOrder(orderId);

  // Discount disabled for now — kept in schema but not applied
  const discountedSubtotal = subtotal;

  // Calculate tax: check tax code, try TaxJar, fallback to manual taxRate
  let tax = 0;
  let taxSource = "none";

  // Tax hierarchy (CommonSKU-style): Item tax code > Order tax code > Company default
  // Order-level tax code OVERRIDES company-level taxExempt when explicitly set
  const company = await (async () => {
    if (!existingOrder?.companyId) return null;
    const [c] = await db.select().from(companies).where(eq(companies.id, existingOrder.companyId));
    return c || null;
  })();
  const companyTaxExempt = company?.taxExempt || false;

  // Resolve the order's tax code (if set)
  const orderTaxCode = await (async () => {
    const taxCodeId = (existingOrder as any)?.defaultTaxCodeId;
    if (!taxCodeId) return null;
    const [tc] = await db.select().from(taxCodes).where(eq(taxCodes.id, taxCodeId));
    return tc || null;
  })();

  // If order has an explicit tax code, it overrides company-level exempt
  // Only use company exempt as default when no order-level tax code is set
  const hasOrderTaxCode = orderTaxCode !== null;
  const isExempt = hasOrderTaxCode
    ? orderTaxCode.isExempt === true   // Order tax code decides
    : companyTaxExempt;                 // Fall back to company default

  if (!isExempt && discountedSubtotal > 0) {
    // Try TaxJar API (if tax code has a TaxJar product code or no tax code is set)
    const taxService = await getTaxJarCredentials();
    if (taxService) {
      try {
        const shippingAddr = (() => {
          try { return existingOrder?.shippingAddress ? JSON.parse(existingOrder.shippingAddress) : null; }
          catch { return null; }
        })();
        if (shippingAddr?.state && shippingAddr?.zipCode) {
          // Load configurable origin address from integration settings
          const [settings] = await db.select().from(integrationSettings).limit(1);
          const fromState = settings?.taxOriginState || "NY";
          const fromZip = settings?.taxOriginZip || "10001";
          const fromCountry = settings?.taxOriginCountry || "US";
          const fromCity = settings?.taxOriginCity || "";
          const fromStreet = settings?.taxOriginStreet || "";

          // Resolve per-item TaxJar product codes
          const allTaxCodeIds = [...new Set(allItems.map((i: any) => i.taxCodeId).filter(Boolean))];
          const itemTaxCodes = allTaxCodeIds.length > 0
            ? await db.select().from(taxCodes).where(inArray(taxCodes.id, allTaxCodeIds))
            : [];
          const taxCodeMap = new Map(itemTaxCodes.map(tc => [tc.id, tc]));

          const taxResult = await taxService.calculateTax({
            from_country: fromCountry,
            from_state: fromState,
            from_zip: fromZip,
            from_city: fromCity,
            from_street: fromStreet,
            to_country: shippingAddr.country || "US",
            to_state: shippingAddr.state,
            to_zip: shippingAddr.zipCode,
            to_city: shippingAddr.city || "",
            to_street: shippingAddr.street || shippingAddr.address || "",
            amount: discountedSubtotal,
            shipping: shippingTotal,
            line_items: allItems.map((item: any) => {
              const itemTaxCode = item.taxCodeId ? taxCodeMap.get(item.taxCodeId) : null;
              const productTaxCode = itemTaxCode?.taxjarProductCode || orderTaxCode?.taxjarProductCode || undefined;
              return {
                id: item.id,
                quantity: item.quantity,
                unit_price: parseFloat(item.unitPrice) || 0,
                discount: 0,
                ...(productTaxCode ? { product_tax_code: productTaxCode } : {}),
              };
            }),
          });
          tax = taxResult.amount_to_collect;
          taxSource = "taxjar";
        }
      } catch (err) {
        console.warn(`TaxJar calculation failed for order ${orderId}, falling back to manual rate:`, err);
      }
    }
    // Fallback to manual tax rate: when TaxJar not available, failed, OR returned 0 but manual rate exists
    if (taxSource === "none" || (taxSource === "taxjar" && tax === 0)) {
      const orderRate = orderTaxCode ? parseFloat(orderTaxCode.rate || "0") : parseFloat((existingOrder as any)?.taxRate || "0");

      // Check for per-item tax code overrides
      const allItemTaxCodeIds = [...new Set(allItems.map((i: any) => i.taxCodeId).filter(Boolean))];
      const itemTaxCodesForManual = allItemTaxCodeIds.length > 0
        ? await db.select().from(taxCodes).where(inArray(taxCodes.id, allItemTaxCodeIds))
        : [];
      const itemTaxCodeMap = new Map(itemTaxCodesForManual.map(tc => [tc.id, tc]));

      let manualTax = 0;
      for (const item of allItems) {
        const itemTotal = parseFloat(item.totalPrice || "0");
        if (itemTotal <= 0) continue;

        const itemTaxCode = item.taxCodeId ? itemTaxCodeMap.get(item.taxCodeId) : null;
        if (itemTaxCode?.isExempt === true) continue; // Per-item exempt → skip

        const rate = itemTaxCode ? parseFloat(itemTaxCode.rate || "0") : orderRate;
        if (rate > 0) {
          manualTax += itemTotal * (rate / 100);
        }
      }

      // Tax additional/service/artwork charges at order rate
      if (orderRate > 0) {
        manualTax += (additionalChargesTotal + serviceChargesTotal + artworkChargesTotal) * (orderRate / 100);
      }

      if (manualTax > 0) {
        tax = manualTax;
        taxSource = "manual";
      }
    }
  }

  const total = discountedSubtotal + shippingTotal + tax;

  // ── Compute order-level cost & margin from actual item/charge costs ──
  // Revenue basis is the pre-tax, pre-shipping subtotal (matches what the client pays for goods+services).
  // All real costs we track contribute; service-charge costs respect the `includeInMargin` flag
  // so pass-through freight can be excluded when desired.
  const itemsCost = allItems.reduce(
    (sum, item) => sum + parseFloat(item.cost || "0") * (item.quantity || 0),
    0,
  );
  const additionalChargesCost = allCharges.reduce((sum: number, c: any) => {
    const parentItem = allItems.find(i => i.id === c.orderItemId);
    const itemQty = parentItem?.quantity || 1;
    const netCost = parseFloat(c.netCost || "0");
    const effectiveQty = getChargeEffectiveQty(c, itemQty);
    return sum + netCost * effectiveQty;
  }, 0);
  const artworkChargesCost = allArtCharges.reduce((sum: number, c: any) => {
    const parentArtwork = allArtworks.find(a => a.id === c.artworkItemId);
    const parentItem = parentArtwork ? allItems.find(i => i.id === parentArtwork.orderItemId) : null;
    const itemQty = parentItem?.quantity || 1;
    const netCost = parseFloat(c.netCost || "0");
    const effectiveQty = getChargeEffectiveQty(c, itemQty);
    return sum + netCost * effectiveQty;
  }, 0);
  const serviceChargesCost = serviceCharges
    .filter((c: any) => c.includeInMargin === true)
    .reduce((sum: number, c: any) => {
      const qty = c.quantity || 1;
      const unitCost = parseFloat(c.unitCost || "0");
      return sum + qty * unitCost;
    }, 0);
  const totalCost = itemsCost + additionalChargesCost + artworkChargesCost + serviceChargesCost;

  const marginPercent = subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0;
  // Clamp to NUMERIC(5,2) range (-999.99..999.99)
  const marginStr = (() => {
    if (!isFinite(marginPercent)) return "0";
    if (marginPercent > 999.99) return "999.99";
    if (marginPercent < -999.99) return "-999.99";
    return marginPercent.toFixed(2);
  })();

  console.log(`Recalculation for order ${orderId}:`, {
    itemsSubtotal: itemsSubtotal.toFixed(2),
    additionalCharges: additionalChargesTotal.toFixed(2),
    serviceCharges: serviceChargesTotal.toFixed(2),
    subtotal: subtotal.toFixed(2),
    discount: "disabled",
    tax: `${tax.toFixed(2)} (${taxSource})`,
    shipping: shippingTotal.toFixed(2),
    total: total.toFixed(2),
    totalCost: totalCost.toFixed(2),
    margin: `${marginStr}%`,
  });

  // Store effective tax rate for display on PDFs
  // Guard against near-zero subtotal (floating point) producing a rate >= 1000, which overflows NUMERIC(5,2)
  const effectiveTaxRate = (() => {
    if (tax <= 0 || discountedSubtotal <= 0) return "0";
    const rate = (tax / discountedSubtotal) * 100;
    if (!isFinite(rate) || rate > 999.99) return "0";
    return rate.toFixed(2);
  })();

  const updatedOrder = await projectRepository.updateOrder(orderId, {
    subtotal: subtotal.toFixed(2),
    shipping: shippingTotal.toFixed(2),
    tax: tax.toFixed(2),
    taxRate: effectiveTaxRate,
    total: total.toFixed(2),
    margin: marginStr,
    taxCalculatedAt: taxSource !== "none" ? new Date() : undefined,
  } as any);

  // Update YTD spending (reuse allItems already fetched above)
  if (updatedOrder.companyId) {
    await updateCompanyYtdSpending(updatedOrder.companyId);
  }
  const supplierIds = Array.from(new Set(allItems.map(item => item.supplierId).filter(Boolean)));
  for (const supplierId of supplierIds) {
    if (supplierId) {
      await updateSupplierYtdSpending(supplierId as string);
    }
  }

  return updatedOrder;
}

// ── Helper: recalculate parent item totalPrice/quantity from its lines ──
async function recalculateItemFromLines(orderItemId: string) {
  const lines = await projectRepository.getOrderItemLines(orderItemId);
  if (lines.length === 0) return;
  const totalQty = lines.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const totalPrice = lines.reduce((sum, l) => {
    const qty = l.quantity || 0;
    const price = parseFloat(l.unitPrice || "0");
    return sum + qty * price;
  }, 0);
  await projectRepository.updateOrderItem(orderItemId, {
    quantity: totalQty,
    totalPrice: totalPrice.toFixed(2),
  } as any);
  // Also recalculate order totals
  const { db } = await import("../db");
  const { orderItems } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const [item] = await db.select({ orderId: orderItems.orderId }).from(orderItems).where(eq(orderItems.id, orderItemId));
  if (item?.orderId) {
    await recalculateOrderTotals(item.orderId);
  }
}

// ── Helper: check service charge lock by orderId ──
async function checkServiceChargeLock(orderId: string, res: Response): Promise<boolean> {
  const order = await projectRepository.getOrder(orderId);
  if (order && isSectionLocked(order, 'salesOrder')) {
    res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
    return true;
  }
  return false;
}

export class ProjectController {

  // ── Projects CRUD ──

  static async list(req: Request, res: Response) {
    try {
      const status = req.query.status as string;
      const companyId = req.query.companyId as string;

      let orders;
      if (status) {
        orders = await projectRepository.getOrdersByStatus(status);
      } else if (companyId) {
        orders = await projectRepository.getOrdersByCompany(companyId);
      } else {
        orders = await projectRepository.getOrders();
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const order = await projectRepository.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { items, ...orderData } = req.body;

      // Resolve default tax code if not explicitly set
      if (!orderData.defaultTaxCodeId) {
        const { db } = await import("../db");
        const { taxCodes } = await import("@shared/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        // Use the tax code marked as default, or fall back to the first exempt code
        const [defaultTc] = await db.select().from(taxCodes)
          .where(eqOp(taxCodes.isDefault, true))
          .limit(1);
        if (defaultTc) {
          orderData.defaultTaxCodeId = defaultTc.id;
        } else {
          const [exemptTc] = await db.select().from(taxCodes)
            .where(eqOp(taxCodes.isExempt, true))
            .limit(1);
          if (exemptTc) {
            orderData.defaultTaxCodeId = exemptTc.id;
          }
        }
      }

      // Apply default payment term if not set
      if (!orderData.paymentTerms) {
        const { db } = await import("../db");
        const { paymentTerms: paymentTermsTable } = await import("@shared/schema");
        const { eq: eqPt } = await import("drizzle-orm");
        const [defaultPt] = await db.select().from(paymentTermsTable)
          .where(eqPt(paymentTermsTable.isDefault, true))
          .limit(1);
        if (defaultPt) {
          orderData.paymentTerms = defaultPt.name;
        }
      }

      const dataToValidate = {
        ...orderData,
        // Only set assignedUserId to current user if not provided from frontend
        assignedUserId: orderData.assignedUserId || (req.user as any)?.claims?.sub,
      };

      // Manually convert date strings to Date objects for validation
      if (dataToValidate.inHandsDate) {
        dataToValidate.inHandsDate = new Date(dataToValidate.inHandsDate);
        // Auto-set supplier in-hands date to 2 days before in-hands date if not explicitly provided
        if (!dataToValidate.supplierInHandsDate) {
          const supplierDate = new Date(dataToValidate.inHandsDate);
          supplierDate.setDate(supplierDate.getDate() - 2);
          dataToValidate.supplierInHandsDate = supplierDate;
        }
      }
      if (dataToValidate.eventDate) {
        dataToValidate.eventDate = new Date(dataToValidate.eventDate);
      }
      if (dataToValidate.supplierInHandsDate) {
        dataToValidate.supplierInHandsDate = new Date(dataToValidate.supplierInHandsDate);
      }

      const validatedData = insertOrderSchema.parse(dataToValidate);

      const order = await projectRepository.createOrder(validatedData);

      // Create order items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await projectRepository.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          });
        }
      }

      // Log activity
      await activityRepository.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'order',
        entityId: order.id,
        action: 'created',
        description: `Created order: ${order.orderNumber}`,
      });

      // Update YTD spending for company
      if (order.companyId) {
        await updateCompanyYtdSpending(order.companyId);
      }
      // Update YTD spending for suppliers from order items
      if (items && items.length > 0) {
        const supplierIds = Array.from(new Set(items.map((item: any) => item.supplierId).filter(Boolean)));
        for (const supplierId of supplierIds) {
          if (supplierId) {
            await updateSupplierYtdSpending(supplierId as string);
          }
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const dataToValidate = { ...req.body };

      // Extract items from request body before validation
      const items = req.body.items;
      delete dataToValidate.items; // Remove items from order data validation

      // Convert date strings to Date objects for validation
      if (dataToValidate.inHandsDate) {
        dataToValidate.inHandsDate = new Date(dataToValidate.inHandsDate);
        // Auto-set supplier in-hands date to 2 days before in-hands date if not explicitly provided
        if (!dataToValidate.supplierInHandsDate) {
          const supplierDate = new Date(dataToValidate.inHandsDate);
          supplierDate.setDate(supplierDate.getDate() - 2);
          dataToValidate.supplierInHandsDate = supplierDate;
        }
      }
      if (dataToValidate.eventDate) {
        dataToValidate.eventDate = new Date(dataToValidate.eventDate);
      }
      if (dataToValidate.supplierInHandsDate) {
        dataToValidate.supplierInHandsDate = new Date(dataToValidate.supplierInHandsDate);
      }
      if (dataToValidate.nextActionDate) {
        dataToValidate.nextActionDate = new Date(dataToValidate.nextActionDate);
      }

      const validatedData = insertOrderSchema.partial().parse(dataToValidate);

      // Get old order to check if company/supplier changed
      const oldOrder = await projectRepository.getOrder(req.params.id);

      // ── Lock validation (allow stageData updates for unlock operations) ──
      if (oldOrder && !req.body.stageData) {
        const isQuoteField = req.body.quoteStatus !== undefined;
        const isSalesOrderField = req.body.salesOrderStatus !== undefined ||
          req.body.paymentTerms !== undefined || req.body.customerPo !== undefined ||
          req.body.margin !== undefined || items;

        if (isQuoteField && isSectionLocked(oldOrder, 'quote')) {
          return res.status(403).json({ message: "Quote is locked. Unlock it first to make changes." });
        }
        if (isSalesOrderField && isSectionLocked(oldOrder, 'salesOrder')) {
          return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
        }
      }

      const order = await projectRepository.updateOrder(req.params.id, validatedData);

      // Fetch existing items once — reused for item processing and supplier YTD
      let existingItems: any[] | undefined;

      // Handle order items if provided
      if (items && Array.isArray(items)) {
        // Get existing order items
        existingItems = await projectRepository.getOrderItems(order.id);
        const existingItemIds = new Set(existingItems.map(item => item.id));

        // Process each item from the request
        for (const item of items) {
          // If item has an ID and exists in database, update it
          if (item.id && !item.id.toString().startsWith('temp-') && existingItemIds.has(item.id)) {
            await projectRepository.updateOrderItem(item.id, {
              quantity: item.quantity,
              cost: item.cost,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              decorationCost: item.decorationCost,
              charges: item.charges,
              sizePricing: item.sizePricing || null,
              color: item.color,
              size: item.size,
              imprintLocation: item.imprintLocation,
              imprintMethod: item.imprintMethod,
              notes: item.notes,
              supplierId: item.supplierId,
            });
          } else if (!item.id || item.id.toString().startsWith('temp-')) {
            // New item (temp ID or no ID), create it
            await projectRepository.createOrderItem({
              orderId: order.id,
              productId: item.productId,
              supplierId: item.supplierId,
              quantity: item.quantity,
              cost: item.cost,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              decorationCost: item.decorationCost,
              charges: item.charges,
              sizePricing: item.sizePricing || null,
              color: item.color,
              size: item.size,
              imprintLocation: item.imprintLocation,
              imprintMethod: item.imprintMethod,
              notes: item.notes,
            });
          }
        }

        // Note: We don't auto-delete items here to prevent accidental data loss
        // and to avoid foreign key constraint violations with artwork_approvals.
        // Users should manually delete items through the UI if needed.
      }

      // Log activity
      await activityRepository.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'order',
        entityId: order.id,
        action: 'updated',
        description: `Updated order: ${order.orderNumber}`,
      });

      // Log project activity for key changes (status, assignments)
      const currentUserId = (req.user as any)?.claims?.sub || "system-user";
      try {
        const { projectActivities } = await import("@shared/schema");
        const { db: actDb } = await import("../db");

        const statusDisplayMap: Record<string, string> = {
          quote: "Quote", pending_approval: "Pending Approval", approved: "Approved",
          in_production: "In Production", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
        };

        if (oldOrder && req.body.status && req.body.status !== oldOrder.status) {
          const oldLabel = statusDisplayMap[oldOrder.status || ""] || oldOrder.status;
          const newLabel = statusDisplayMap[req.body.status] || req.body.status;
          await actDb.insert(projectActivities).values({
            orderId: order.id,
            userId: currentUserId,
            activityType: "status_change",
            content: `Status changed from ${oldLabel} to ${newLabel}`,
            metadata: { oldStatus: oldOrder.status, newStatus: req.body.status },
            isSystemGenerated: false,
          });
        }

        // Log quoteStatus changes
        if (oldOrder && req.body.quoteStatus && req.body.quoteStatus !== (oldOrder as any).quoteStatus) {
          const quoteDisplayMap: Record<string, string> = {
            draft: "Draft", sent: "Sent to Client", approved: "Approved", rejected: "Rejected", expired: "Expired",
          };
          const oldLabel = quoteDisplayMap[(oldOrder as any).quoteStatus || ""] || (oldOrder as any).quoteStatus || "None";
          const newLabel = quoteDisplayMap[req.body.quoteStatus] || req.body.quoteStatus;
          await actDb.insert(projectActivities).values({
            orderId: order.id, userId: currentUserId, activityType: "status_change",
            content: `Quote status changed from ${oldLabel} to ${newLabel}`,
            metadata: { section: 'quote', oldStatus: (oldOrder as any).quoteStatus, newStatus: req.body.quoteStatus },
            isSystemGenerated: false,
          });
        }

        // Log salesOrderStatus changes
        if (oldOrder && req.body.salesOrderStatus && req.body.salesOrderStatus !== (oldOrder as any).salesOrderStatus) {
          const soDisplayMap: Record<string, string> = {
            new: "New", pending_client_approval: "Pending Client Approval", client_change_requested: "Client Change Requested",
            client_approved: "Client Approved", in_production: "In Production", shipped: "Shipped", ready_to_invoice: "Ready To Be Invoiced",
          };
          const oldLabel = soDisplayMap[(oldOrder as any).salesOrderStatus || ""] || (oldOrder as any).salesOrderStatus || "None";
          const newLabel = soDisplayMap[req.body.salesOrderStatus] || req.body.salesOrderStatus;
          await actDb.insert(projectActivities).values({
            orderId: order.id, userId: currentUserId, activityType: "status_change",
            content: `Sales Order status changed from ${oldLabel} to ${newLabel}`,
            metadata: { section: 'sales_order', oldStatus: (oldOrder as any).salesOrderStatus, newStatus: req.body.salesOrderStatus },
            isSystemGenerated: false,
          });

          // Auto-generate invoice when SO transitions to client_approved (idempotent)
          if (req.body.salesOrderStatus === 'client_approved') {
            try {
              const { invoiceRepository } = await import("../repositories/invoice.repository");
              const existing = await invoiceRepository.getInvoiceByOrderId(order.id);
              if (!existing) {
                const taxAmount = Number((order as any).tax || 0);
                const totalAmount = Number((order as any).subtotal || 0) + taxAmount + Number((order as any).shipping || 0);
                await invoiceRepository.createInvoice({
                  orderId: order.id,
                  invoiceNumber: `INV-${Date.now()}`,
                  subtotal: (order as any).subtotal ?? "0",
                  taxAmount: taxAmount.toString(),
                  totalAmount: totalAmount.toString(),
                  status: "pending",
                  dueDate: new Date(),
                });
                await actDb.insert(projectActivities).values({
                  orderId: order.id, userId: currentUserId, activityType: "system_action",
                  content: `Invoice auto-generated after Sales Order moved to Client Approved`,
                  metadata: { action: "invoice_auto_created", trigger: "sales_order_client_approved" },
                  isSystemGenerated: true,
                });
              }
            } catch (invErr) {
              console.error("Auto-invoice creation failed:", invErr);
            }
          }
        }

        // Log presentationStatus changes
        if (oldOrder && req.body.presentationStatus && req.body.presentationStatus !== (oldOrder as any).presentationStatus) {
          const presDisplayMap: Record<string, string> = {
            open: "Open", client_review: "Client Review", converted: "Converted", closed: "Closed",
          };
          const oldLabel = presDisplayMap[(oldOrder as any).presentationStatus || ""] || (oldOrder as any).presentationStatus || "None";
          const newLabel = presDisplayMap[req.body.presentationStatus] || req.body.presentationStatus;
          await actDb.insert(projectActivities).values({
            orderId: order.id, userId: currentUserId, activityType: "status_change",
            content: `Presentation status changed from ${oldLabel} to ${newLabel}`,
            metadata: { section: 'presentation', oldStatus: (oldOrder as any).presentationStatus, newStatus: req.body.presentationStatus },
            isSystemGenerated: false,
          });
        }

        // Log lock/unlock events via stageData.unlocks changes
        if (oldOrder && req.body.stageData?.unlocks) {
          const oldUnlocks = (oldOrder as any).stageData?.unlocks || {};
          const newUnlocks = req.body.stageData.unlocks;
          const sectionLabels: Record<string, string> = { quote: "Quote", salesOrder: "Sales Order", invoice: "Invoice" };
          for (const section of ['quote', 'salesOrder', 'invoice'] as const) {
            if (newUnlocks[section] && !oldUnlocks[section]) {
              await actDb.insert(projectActivities).values({
                orderId: order.id, userId: currentUserId, activityType: "system_action",
                content: `${sectionLabels[section]} section unlocked for editing`,
                metadata: { action: 'section_unlocked', section },
                isSystemGenerated: false,
              });
            }
          }
        }

        // Auto-relock: clear unlock overrides when status transitions trigger a new lock
        if (oldOrder && req.body.salesOrderStatus === 'ready_to_invoice' && (oldOrder as any).salesOrderStatus !== 'ready_to_invoice') {
          const currentStageData = (order as any).stageData || {};
          if (currentStageData.unlocks?.salesOrder) {
            const updatedStageData = { ...currentStageData, unlocks: { ...(currentStageData.unlocks || {}) } };
            delete updatedStageData.unlocks.salesOrder;
            await projectRepository.updateOrder(order.id, { stageData: updatedStageData } as any);
          }
        }

        if (req.body.assignedUserId !== undefined && oldOrder && req.body.assignedUserId !== oldOrder.assignedUserId) {
          if (req.body.assignedUserId) {
            const repUser = await userRepository.getUser(req.body.assignedUserId);
            const repName = repUser ? `${repUser.firstName} ${repUser.lastName}` : "Unknown";
            await actDb.insert(projectActivities).values({
              orderId: order.id,
              userId: currentUserId,
              activityType: "system_action",
              content: `Sales Rep assigned: ${repName}`,
              metadata: { action: 'salesrep_assigned', userId: req.body.assignedUserId },
              isSystemGenerated: false,
            });
          }
        }

        if (req.body.csrUserId !== undefined && oldOrder && req.body.csrUserId !== oldOrder.csrUserId) {
          if (req.body.csrUserId) {
            const csrUserData = await userRepository.getUser(req.body.csrUserId);
            const csrName = csrUserData ? `${csrUserData.firstName} ${csrUserData.lastName}` : "Unknown";
            await actDb.insert(projectActivities).values({
              orderId: order.id,
              userId: currentUserId,
              activityType: "system_action",
              content: `CSR assigned: ${csrName}`,
              metadata: { action: 'csr_assigned', userId: req.body.csrUserId },
              isSystemGenerated: false,
            });
          }
        }

        // Assignment notifications
        const needsSalesRepNotify = req.body.assignedUserId !== undefined && oldOrder && req.body.assignedUserId !== oldOrder.assignedUserId && req.body.assignedUserId && req.body.assignedUserId !== currentUserId;
        const needsCsrNotify = req.body.csrUserId !== undefined && oldOrder && req.body.csrUserId !== oldOrder.csrUserId && req.body.csrUserId && req.body.csrUserId !== currentUserId;

        if (needsSalesRepNotify || needsCsrNotify) {
          const assignerUser = await userRepository.getUser(currentUserId);
          const assignerName = assignerUser ? `${assignerUser.firstName} ${assignerUser.lastName}`.trim() : "Someone";

          if (needsSalesRepNotify) {
            await notificationRepository.create({
              recipientId: req.body.assignedUserId,
              senderId: currentUserId,
              orderId: order.id,
              type: "team_update",
              title: "You've been assigned as Sales Rep",
              message: `${assignerName} assigned you as Sales Rep on order #${order.orderNumber}`,
            });
          }

          if (needsCsrNotify) {
            await notificationRepository.create({
              recipientId: req.body.csrUserId,
              senderId: currentUserId,
              orderId: order.id,
              type: "team_update",
              title: "You've been assigned as CSR",
              message: `${assignerName} assigned you as CSR on order #${order.orderNumber}`,
            });
          }
        }
      } catch (actError) {
        console.error("Failed to log project activity:", actError);
      }

      // Update YTD spending for current company
      if (order.companyId) {
        await updateCompanyYtdSpending(order.companyId);
      }

      // Update YTD spending for suppliers — reuse existingItems if available, else fetch once
      const itemsForSupplierYtd = items ? await projectRepository.getOrderItems(order.id) : (existingItems || []);
      const currentSupplierIds = Array.from(new Set(itemsForSupplierYtd.map((item: any) => item.supplierId).filter(Boolean)));
      for (const supplierId of currentSupplierIds) {
        if (supplierId) {
          await updateSupplierYtdSpending(supplierId as string);
        }
      }

      // Also update old company if it changed
      if (oldOrder?.companyId && oldOrder.companyId !== order.companyId) {
        await updateCompanyYtdSpending(oldOrder.companyId);
      }

      // Recalculate totals when pricing-related fields change
      const pricingFields = ['orderDiscount', 'taxRate', 'shippingAddress', 'billingAddress', 'defaultTaxCodeId'];
      const hasPricingChange = pricingFields.some(f => req.body[f] !== undefined);
      if (hasPricingChange || items) {
        try {
          const recalculated = await recalculateOrderTotals(order.id);
          return res.json(recalculated);
        } catch (recalcErr) {
          console.warn("Recalculation after PATCH failed:", recalcErr);
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to update order" });
    }
  }

  static async duplicate(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { db } = await import("../db");
      const { orders, orderItems, artworkItems, orderAdditionalCharges, orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Get source order
      const [sourceOrder] = await db.select().from(orders).where(eq(orders.id, projectId));
      if (!sourceOrder) return res.status(404).json({ message: "Order not found" });

      // Get source items
      const sourceItems = await db.select().from(orderItems).where(eq(orderItems.orderId, projectId));

      // Generate new order number using shared utility
      const { generateOrderNumber } = await import("../utils/orderNumber");
      const newOrderNumber = await generateOrderNumber();

      // Create duplicate order (reset statuses, keep content)
      const [newOrder] = await db.insert(orders).values({
        orderNumber: newOrderNumber,
        companyId: sourceOrder.companyId,
        contactId: sourceOrder.contactId,
        assignedUserId: sourceOrder.assignedUserId,
        csrUserId: sourceOrder.csrUserId,
        status: "quote",
        orderType: "quote",
        subtotal: sourceOrder.subtotal,
        tax: "0",
        shipping: sourceOrder.shipping,
        total: sourceOrder.subtotal,
        margin: sourceOrder.margin,
        inHandsDate: sourceOrder.inHandsDate,
        eventDate: sourceOrder.eventDate,
        supplierInHandsDate: sourceOrder.supplierInHandsDate,
        isFirm: sourceOrder.isFirm,
        isRush: sourceOrder.isRush,
        customerPo: null,
        paymentTerms: sourceOrder.paymentTerms,
        orderDiscount: sourceOrder.orderDiscount,
        notes: sourceOrder.notes,
        customerNotes: sourceOrder.customerNotes,
        internalNotes: sourceOrder.internalNotes,
        supplierNotes: sourceOrder.supplierNotes,
        additionalInformation: sourceOrder.additionalInformation,
        shippingAddress: sourceOrder.shippingAddress,
        billingAddress: sourceOrder.billingAddress,
        shippingMethod: sourceOrder.shippingMethod,
        currentStage: "created",
        stagesCompleted: ["created"],
        stageData: {},
        customNotes: {},
        presentationStatus: "open",
        salesOrderStatus: "new",
        quoteStatus: "draft",
      } as any).returning();

      // Copy order items
      const itemIdMap: Record<string, string> = {};
      for (const item of sourceItems) {
        const [newItem] = await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          supplierId: item.supplierId,
          quantity: item.quantity,
          cost: item.cost,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          decorationCost: item.decorationCost,
          charges: item.charges,
          sizePricing: item.sizePricing,
          uomFactory: item.uomFactory,
          color: item.color,
          size: item.size,
          imprintLocation: item.imprintLocation,
          imprintMethod: item.imprintMethod,
          decoratorType: item.decoratorType,
          priceLabel: item.priceLabel,
          personalComment: item.personalComment,
          privateNotes: item.privateNotes,
          notes: item.notes,
          shippingDestination: item.shippingDestination,
          shippingAccountType: item.shippingAccountType,
          shippingMethodOverride: item.shippingMethodOverride,
          shippingNotes: item.shippingNotes,
        } as any).returning();
        itemIdMap[item.id] = newItem.id;

        // Copy artwork items for this order item
        const sourceArtworks = await db.select().from(artworkItems).where(eq(artworkItems.orderItemId, item.id));
        for (const art of sourceArtworks) {
          await db.insert(artworkItems).values({
            orderItemId: newItem.id,
            name: art.name,
            artworkType: art.artworkType,
            location: art.location,
            color: art.color,
            numberOfColors: (art as any).numberOfColors || 1,
            size: art.size,
            status: "pending",
            fileName: art.fileName,
            filePath: art.filePath,
            proofRequired: art.proofRequired,
            notes: art.notes,
          } as any);
        }

        // Copy additional charges for this order item
        const sourceCharges = await db.select().from(orderAdditionalCharges).where(eq(orderAdditionalCharges.orderItemId, item.id));
        for (const charge of sourceCharges) {
          await db.insert(orderAdditionalCharges).values({
            orderItemId: newItem.id,
            description: charge.description,
            chargeType: charge.chargeType,
            amount: charge.amount,
            isVendorCharge: charge.isVendorCharge,
            displayToClient: charge.displayToClient,
          } as any);
        }
      }

      // Copy service charges
      const sourceServiceCharges = await db.select().from(orderServiceCharges).where(eq(orderServiceCharges.orderId, projectId));
      for (const sc of sourceServiceCharges) {
        await db.insert(orderServiceCharges).values({
          orderId: newOrder.id,
          chargeType: sc.chargeType,
          description: sc.description,
          quantity: sc.quantity,
          unitCost: sc.unitCost,
          unitPrice: sc.unitPrice,
          taxable: sc.taxable,
          includeInMargin: sc.includeInMargin,
          displayToClient: sc.displayToClient,
          vendorId: sc.vendorId,
          notes: sc.notes,
        } as any);
      }

      // Log activity
      const { projectActivities } = await import("@shared/schema");
      await db.insert(projectActivities).values({
        orderId: newOrder.id,
        userId: (req.user as any)?.claims?.sub || (req.user as any)?.id,
        activityType: "system_action",
        content: `Order duplicated from #${sourceOrder.orderNumber}`,
        metadata: { action: "order_duplicated", sourceOrderId: projectId, sourceOrderNumber: sourceOrder.orderNumber },
      } as any);

      res.json({ success: true, order: newOrder });
    } catch (error) {
      console.error("Error duplicating order:", error);
      res.status(500).json({ message: "Failed to duplicate order" });
    }
  }

  static async recalculateTotal(req: Request, res: Response) {
    try {
      const updatedOrder = await recalculateOrderTotals(req.params.id);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error recalculating order total:", error);
      res.status(500).json({ message: "Failed to recalculate order total" });
    }
  }

  // ── Batch: Items with lines, charges, and artwork in a single request ──

  static async listItemsWithDetails(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { orderItemLines, orderAdditionalCharges, artworkItems, artworkCharges, artworkItemFiles } = await import("@shared/schema");
      const { inArray } = await import("drizzle-orm");

      const items = await projectRepository.getOrderItems(req.params.projectId);
      const itemIds = items.map(item => item.id);

      if (itemIds.length === 0) {
        return res.json({ items, lines: {}, charges: {}, artworks: {}, artworkCharges: {} });
      }

      // Batch queries
      const [allLines, allCharges, allArtworks] = await Promise.all([
        db.select().from(orderItemLines).where(inArray(orderItemLines.orderItemId, itemIds)),
        db.select().from(orderAdditionalCharges).where(inArray(orderAdditionalCharges.orderItemId, itemIds)),
        db.select().from(artworkItems).where(inArray(artworkItems.orderItemId, itemIds)),
      ]);

      // Fetch artwork charges + files for all artworks
      const artworkIds = allArtworks.map(a => a.id);
      const [allArtworkCharges, allArtItemFiles] = artworkIds.length > 0
        ? await Promise.all([
            db.select().from(artworkCharges).where(inArray(artworkCharges.artworkItemId, artworkIds)),
            db.select().from(artworkItemFiles).where(inArray(artworkItemFiles.artworkItemId, artworkIds)),
          ])
        : [[], []];

      // Group by keys
      const lines: Record<string, any[]> = {};
      const charges: Record<string, any[]> = {};
      const artworks: Record<string, any[]> = {};
      const artCharges: Record<string, any[]> = {};

      for (const line of allLines) { (lines[line.orderItemId] ??= []).push(line); }
      for (const charge of allCharges) { (charges[charge.orderItemId] ??= []).push(charge); }
      for (const art of allArtworks) { (artworks[art.orderItemId] ??= []).push(art); }
      for (const ac of allArtworkCharges) { (artCharges[ac.artworkItemId] ??= []).push(ac); }

      const artFiles: Record<string, any[]> = {};
      for (const af of allArtItemFiles) { (artFiles[af.artworkItemId] ??= []).push(af); }

      res.json({ items, lines, charges, artworks, artworkCharges: artCharges, artworkFiles: artFiles });
    } catch (error) {
      console.error("Error fetching items with details:", error);
      res.status(500).json({ message: "Failed to fetch items with details" });
    }
  }

  // ── Project Items ──

  static async listItems(req: Request, res: Response) {
    try {
      const items = await projectRepository.getOrderItems(req.params.projectId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  }

  static async createItem(req: Request, res: Response) {
    try {
      // Lock check
      const parentOrder = await projectRepository.getOrder(req.params.projectId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      // If supplierId is not provided, get it from the product
      let dataToInsert = {
        ...req.body,
        orderId: req.params.projectId,
      };

      if (!dataToInsert.supplierId && dataToInsert.productId) {
        const { db } = await import("../db");
        const { products } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, dataToInsert.productId))
          .limit(1);

        if (product && product.supplierId) {
          dataToInsert.supplierId = product.supplierId;
          console.log(`Auto-populated supplierId ${product.supplierId} from product ${product.id}`);
        }
      }

      // Vendor "Do Not Order" enforcement
      if (dataToInsert.supplierId) {
        const supplier = await supplierRepository.getById(dataToInsert.supplierId);
        if (supplier && supplier.doNotOrder) {
          // Check for an approved vendor approval request for this order
          const { db } = await import("../db");
          const { vendorApprovalRequests } = await import("@shared/schema");
          const { eq, and } = await import("drizzle-orm");

          const [approvedRequest] = await db
            .select()
            .from(vendorApprovalRequests)
            .where(
              and(
                eq(vendorApprovalRequests.supplierId, dataToInsert.supplierId),
                eq(vendorApprovalRequests.orderId, req.params.projectId),
                eq(vendorApprovalRequests.status, "approved")
              )
            )
            .limit(1);

          if (!approvedRequest) {
            return res.status(403).json({
              message: `Vendor "${supplier.name}" is marked as Do Not Order. Request approval from an admin before adding products from this vendor.`,
              doNotOrder: true,
              supplierId: supplier.id,
              supplierName: supplier.name,
            });
          }
        }
      }

      const validatedData = insertOrderItemSchema.parse(dataToInsert);

      const item = await projectRepository.createOrderItem(validatedData);

      // Recalculate order totals (includes discount, tax, shipping)
      await recalculateOrderTotals(req.params.projectId);

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  }

  static async deleteItem(req: Request, res: Response) {
    try {
      // Lock check
      const parentOrder = await projectRepository.getOrder(req.params.projectId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      // Delete dependent records to prevent foreign key constraint violations
      const { db } = await import("../db");
      const { artworkApprovals, artworkItems, mediaLibrary, orderFiles } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await db.delete(artworkApprovals).where(eq(artworkApprovals.orderItemId, req.params.itemId));
      await db.delete(artworkItems).where(eq(artworkItems.orderItemId, req.params.itemId));
      await db.update(mediaLibrary).set({ orderItemId: null }).where(eq(mediaLibrary.orderItemId, req.params.itemId));
      await db.update(orderFiles).set({ orderItemId: null }).where(eq(orderFiles.orderItemId, req.params.itemId));

      // Now safe to delete the order item
      await projectRepository.deleteOrderItem(req.params.itemId);

      // Recalculate order totals (includes discount, tax, shipping)
      await recalculateOrderTotals(req.params.projectId);

      res.json({ message: "Order item deleted successfully" });
    } catch (error) {
      console.error("Error deleting order item:", error);
      res.status(500).json({ message: "Failed to delete order item" });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      // Lock check
      const parentOrder = await projectRepository.getOrder(req.params.projectId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      // Convert timestamp strings to Date objects for Drizzle
      const body = { ...req.body };
      const timestampFields = ['shipInHandsDate', 'leg2InHandsDate'];
      for (const field of timestampFields) {
        if (body[field] && typeof body[field] === 'string') {
          body[field] = new Date(body[field]);
        }
      }

      // Clear leg2 fields when destination changes away from "decorator"
      if (body.shippingDestination && body.shippingDestination !== "decorator") {
        body.leg2ShipTo = null;
        body.leg2AddressId = null;
        body.leg2Address = null;
        body.leg2InHandsDate = null;
        body.leg2Firm = false;
        body.leg2ShippingMethod = null;
        body.leg2ShippingAccountType = null;
        body.leg2ShippingQuote = null;
      }

      const updatedItem = await projectRepository.updateOrderItem(req.params.itemId, body);

      // Recalculate order totals if pricing fields changed
      const pricingFields = ['quantity', 'unitPrice', 'totalPrice', 'cost', 'decorationCost', 'charges', 'taxCodeId'];
      if (pricingFields.some(f => req.body[f] !== undefined)) {
        await recalculateOrderTotals(req.params.projectId);
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating order item:", error);
      res.status(500).json({ message: "Failed to update order item" });
    }
  }

  // ── Artwork Items ──

  static async listArtworks(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItems } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const artworks = await db
        .select()
        .from(artworkItems)
        .where(eq(artworkItems.orderItemId, req.params.itemId));

      res.json(artworks);
    } catch (error) {
      console.error("Error fetching artwork items:", error);
      res.status(500).json({ message: "Failed to fetch artwork items" });
    }
  }

  static async createArtwork(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItems } = await import("@shared/schema");

      let filePath = null;
      let fileName = null;

      // Handle file upload if present
      if (req.file) {
        filePath = (req.file as any).path; // Cloudinary URL
        fileName = req.file.originalname;
      } else if (req.body.filePath) {
        // Support picking existing file from media library
        filePath = req.body.filePath;
        fileName = req.body.fileName || 'artwork';
      }

      const resolvedFileName = resolveArtworkFileName(req.body.name, fileName);

      const artworkData = {
        orderItemId: req.params.itemId,
        name: req.body.name,
        artworkType: req.body.artworkType || null,
        location: req.body.location || null,
        color: req.body.color || null,
        numberOfColors: parseInt(req.body.numberOfColors) || 1,
        size: req.body.size || null,
        status: req.body.status || 'pending',
        fileName: resolvedFileName,
        filePath: filePath,
        repeatLogo: req.body.repeatLogo || false,
        notes: req.body.notes || null,
      };

      const [artwork] = await db
        .insert(artworkItems)
        .values(artworkData)
        .returning();

      // Dual-write to media library
      if (filePath && fileName) {
        try {
          const userId = (req.user as any)?.id;
          const publicId = req.file ? ((req.file as any).filename || (req.file as any).public_id) : undefined;
          await registerInMediaLibrary({
            cloudinaryUrl: filePath,
            cloudinaryPublicId: publicId,
            fileName: publicId || fileName,
            originalName: fileName,
            fileSize: req.file?.size,
            mimeType: req.file?.mimetype,
            category: "artwork",
            orderItemId: req.params.itemId,
            sourceTable: "artwork_items",
            sourceId: artwork.id,
            uploadedBy: userId,
            tags: ["artwork"],
          });
        } catch (mlError) {
          console.error("Failed to register in media library (non-blocking):", mlError);
        }
      }

      res.status(201).json(artwork);
    } catch (error) {
      console.error("Error creating artwork item:", error);
      res.status(500).json({ message: "Failed to create artwork item" });
    }
  }

  static async updateArtwork(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItems } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const updateData: any = {
        name: req.body.name,
        artworkType: req.body.artworkType || null,
        location: req.body.location || null,
        color: req.body.color || null,
        size: req.body.size || null,
        status: req.body.status,
        notes: req.body.notes || null,
        repeatLogo: req.body.repeatLogo !== undefined ? req.body.repeatLogo : undefined,
        proofRequired: req.body.proofRequired !== undefined ? req.body.proofRequired : undefined,
        proofFilePath: req.body.proofFilePath !== undefined ? req.body.proofFilePath : undefined,
        proofFileName: req.body.proofFileName !== undefined ? req.body.proofFileName : undefined,
        updatedAt: new Date(),
      };
      // Remove undefined fields so they don't overwrite existing values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      // Handle file upload if present
      if (req.file) {
        updateData.filePath = (req.file as any).path; // Cloudinary URL
        updateData.fileName = req.file.originalname;
      }

      // Keep stored fileName in sync with the user-entered display name so
      // email attachments / PDFs use the renamed value.
      if (req.body.name !== undefined) {
        const { artworkItems: artworkItemsTable } = await import("@shared/schema");
        const existing = req.file
          ? null
          : (await db.select().from(artworkItemsTable).where(eq(artworkItemsTable.id, req.params.artworkId)))[0];
        const baseFileName = updateData.fileName ?? existing?.fileName ?? null;
        updateData.fileName = resolveArtworkFileName(req.body.name, baseFileName);
      }

      const [artwork] = await db
        .update(artworkItems)
        .set(updateData)
        .where(
          and(
            eq(artworkItems.id, req.params.artworkId),
            eq(artworkItems.orderItemId, req.params.itemId)
          )
        )
        .returning();

      if (!artwork) {
        return res.status(404).json({ message: "Artwork not found" });
      }

      res.json(artwork);
    } catch (error) {
      console.error("Error updating artwork item:", error);
      res.status(500).json({ message: "Failed to update artwork item" });
    }
  }

  static async deleteArtwork(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItems, orderItems: orderItemsTbl } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(artworkItems)
        .where(
          and(
            eq(artworkItems.id, req.params.artworkId),
            eq(artworkItems.orderItemId, req.params.itemId)
          )
        );

      // Recalculate order totals (deleted artwork removes its charges)
      const [item] = await db.select().from(orderItemsTbl).where(eq(orderItemsTbl.id, req.params.itemId));
      if (item?.orderId) await recalculateOrderTotals(item.orderId);

      res.json({ message: "Artwork deleted successfully" });
    } catch (error) {
      console.error("Error deleting artwork item:", error);
      res.status(500).json({ message: "Failed to delete artwork item" });
    }
  }

  // ── Artwork Item Files (multiple files per artwork) ──

  static async listArtworkFiles(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItemFiles } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const files = await db.select().from(artworkItemFiles)
        .where(eq(artworkItemFiles.artworkItemId, req.params.artworkId))
        .orderBy(artworkItemFiles.sortOrder);
      res.json(files);
    } catch (error) {
      console.error("Error listing artwork files:", error);
      res.status(500).json({ message: "Failed to list artwork files" });
    }
  }

  static async addArtworkFile(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItemFiles } = await import("@shared/schema");
      const [file] = await db.insert(artworkItemFiles).values({
        artworkItemId: req.params.artworkId,
        fileName: req.body.fileName,
        filePath: req.body.filePath,
        fileSize: req.body.fileSize || null,
        mimeType: req.body.mimeType || null,
        sortOrder: req.body.sortOrder || 0,
        isPrimary: req.body.isPrimary || false,
      }).returning();
      res.status(201).json(file);
    } catch (error) {
      console.error("Error adding artwork file:", error);
      res.status(500).json({ message: "Failed to add artwork file" });
    }
  }

  static async removeArtworkFile(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkItemFiles } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(artworkItemFiles).where(and(
        eq(artworkItemFiles.id, req.params.fileId),
        eq(artworkItemFiles.artworkItemId, req.params.artworkId),
      ));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing artwork file:", error);
      res.status(500).json({ message: "Failed to remove artwork file" });
    }
  }

  // ── Copy Artwork Between Products ──

  static async copyArtwork(req: Request, res: Response) {
    try {
      const { itemId, sourceArtworkId } = req.params;
      const includePricing = req.query.includePricing === "true";

      const { db } = await import("../db");
      const { artworkItems, artworkCharges, artworkItemFiles } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Fetch source artwork
      const [source] = await db.select().from(artworkItems).where(eq(artworkItems.id, sourceArtworkId));
      if (!source) return res.status(404).json({ message: "Source artwork not found" });

      // Clone artwork
      const { id: _id, orderItemId: _oid, createdAt: _ca, updatedAt: _ua, proofFilePath: _pf, proofFileName: _pfn, ...artData } = source;
      const [newArt] = await db.insert(artworkItems).values({
        ...artData,
        orderItemId: itemId,
        status: "pending",
      }).returning();

      // Clone files
      const sourceFiles = await db.select().from(artworkItemFiles).where(eq(artworkItemFiles.artworkItemId, sourceArtworkId));
      for (const f of sourceFiles) {
        const { id: _fid, artworkItemId: _faid, createdAt: _fca, ...fileData } = f;
        await db.insert(artworkItemFiles).values({ ...fileData, artworkItemId: newArt.id });
      }

      // Clone charges if requested
      if (includePricing) {
        const sourceCharges = await db.select().from(artworkCharges).where(eq(artworkCharges.artworkItemId, sourceArtworkId));
        for (const c of sourceCharges) {
          const { id: _cid, artworkItemId: _caid, createdAt: _cca, updatedAt: _cua, ...chargeData } = c;
          await db.insert(artworkCharges).values({ ...chargeData, artworkItemId: newArt.id });
        }
      }

      res.status(201).json(newArt);
    } catch (error) {
      console.error("Error copying artwork:", error);
      res.status(500).json({ message: "Failed to copy artwork" });
    }
  }

  // ── Artwork Charges ──

  static async listArtworkCharges(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const charges = await db.select().from(artworkCharges).where(eq(artworkCharges.artworkItemId, req.params.artworkId));
      res.json(charges);
    } catch (error) {
      console.error("Error fetching artwork charges:", error);
      res.status(500).json({ message: "Failed to fetch artwork charges" });
    }
  }

  static async createArtworkCharge(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { insertArtworkChargeSchema, artworkItems } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const validated = insertArtworkChargeSchema.parse({
        ...req.body,
        artworkItemId: req.params.artworkId,
      });
      const [charge] = await db.insert((await import("@shared/schema")).artworkCharges).values(validated).returning();

      // Trigger order total recalc so overview/PDF stay in sync
      const { orderItems: orderItemsTbl } = await import("@shared/schema");
      const [parentArtwork] = await db.select().from(artworkItems).where(eq(artworkItems.id, req.params.artworkId));
      if (parentArtwork) {
        const [item] = await db.select().from(orderItemsTbl).where(eq(orderItemsTbl.id, parentArtwork.orderItemId));
        if (item?.orderId) await recalculateOrderTotals(item.orderId);
      }

      res.status(201).json(charge);
    } catch (error) {
      console.error("Error creating artwork charge:", error);
      res.status(500).json({ message: "Failed to create artwork charge" });
    }
  }

  static async updateArtworkCharge(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkCharges, artworkItems } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const [updated] = await db
        .update(artworkCharges)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(artworkCharges.id, req.params.chargeId), eq(artworkCharges.artworkItemId, req.params.artworkId)))
        .returning();
      if (!updated) return res.status(404).json({ message: "Charge not found" });

      // Trigger order total recalc so overview/PDF stay in sync
      const { orderItems: orderItemsTbl } = await import("@shared/schema");
      const [parentArtwork] = await db.select().from(artworkItems).where(eq(artworkItems.id, req.params.artworkId));
      if (parentArtwork) {
        const [item] = await db.select().from(orderItemsTbl).where(eq(orderItemsTbl.id, parentArtwork.orderItemId));
        if (item?.orderId) await recalculateOrderTotals(item.orderId);
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating artwork charge:", error);
      res.status(500).json({ message: "Failed to update artwork charge" });
    }
  }

  static async deleteArtworkCharge(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { artworkCharges, artworkItems } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      // Capture orderId BEFORE delete
      const { orderItems: orderItemsTbl } = await import("@shared/schema");
      const [parentArtwork] = await db.select().from(artworkItems).where(eq(artworkItems.id, req.params.artworkId));
      let orderId: string | null = null;
      if (parentArtwork) {
        const [item] = await db.select().from(orderItemsTbl).where(eq(orderItemsTbl.id, parentArtwork.orderItemId));
        orderId = item?.orderId || null;
      }

      await db.delete(artworkCharges).where(and(eq(artworkCharges.id, req.params.chargeId), eq(artworkCharges.artworkItemId, req.params.artworkId)));

      // Trigger order total recalc so overview/PDF stay in sync
      if (orderId) await recalculateOrderTotals(orderId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting artwork charge:", error);
      res.status(500).json({ message: "Failed to delete artwork charge" });
    }
  }

  // ── Item Lines ──

  static async listLines(req: Request, res: Response) {
    try {
      const lines = await projectRepository.getOrderItemLines(req.params.itemId);
      res.json(lines);
    } catch (error) {
      console.error("Error fetching order item lines:", error);
      res.status(500).json({ message: "Failed to fetch order item lines" });
    }
  }

  static async createLine(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.itemId, res)) return;
      const validatedData = insertOrderItemLineSchema.parse({
        ...req.body,
        orderItemId: req.params.itemId,
      });
      const line = await projectRepository.createOrderItemLine(validatedData);
      await recalculateItemFromLines(req.params.itemId);
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating order item line:", error);
      res.status(500).json({ message: "Failed to create order item line" });
    }
  }

  static async updateLine(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.itemId, res)) return;

      const line = await projectRepository.updateOrderItemLine(req.params.lineId, req.body);
      await recalculateItemFromLines(req.params.itemId);
      res.json(line);
    } catch (error) {
      console.error("Error updating order item line:", error);
      res.status(500).json({ message: "Failed to update order item line" });
    }
  }

  static async deleteLine(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.itemId, res)) return;
      await projectRepository.deleteOrderItemLine(req.params.lineId);
      await recalculateItemFromLines(req.params.itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order item line:", error);
      res.status(500).json({ message: "Failed to delete order item line" });
    }
  }

  // ── Additional Charges ──

  static async listCharges(req: Request, res: Response) {
    try {
      const charges = await projectRepository.getOrderAdditionalCharges(req.params.itemId);
      res.json(charges);
    } catch (error) {
      console.error("Error fetching order additional charges:", error);
      res.status(500).json({ message: "Failed to fetch order additional charges" });
    }
  }

  static async createCharge(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.itemId, res)) return;
      const validatedData = insertOrderAdditionalChargeSchema.parse({
        ...req.body,
        orderItemId: req.params.itemId,
      });
      const charge = await projectRepository.createOrderAdditionalCharge(validatedData);

      // Recalc order totals so Overview/PDF stay synced
      const orderId = await getOrderIdFromItemId(req.params.itemId);
      if (orderId) await recalculateOrderTotals(orderId);

      res.status(201).json(charge);
    } catch (error) {
      console.error("Error creating order additional charge:", error);
      res.status(500).json({ message: "Failed to create order additional charge" });
    }
  }

  static async updateCharge(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.itemId, res)) return;
      const charge = await projectRepository.updateOrderAdditionalCharge(req.params.chargeId, req.body);

      // Recalc order totals so Overview/PDF stay synced
      const orderId = await getOrderIdFromItemId(req.params.itemId);
      if (orderId) await recalculateOrderTotals(orderId);

      res.json(charge);
    } catch (error) {
      console.error("Error updating order additional charge:", error);
      res.status(500).json({ message: "Failed to update order additional charge" });
    }
  }

  static async deleteCharge(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.itemId, res)) return;
      await projectRepository.deleteOrderAdditionalCharge(req.params.chargeId);

      // Recalc order totals so Overview/PDF stay synced
      const orderId = await getOrderIdFromItemId(req.params.itemId);
      if (orderId) await recalculateOrderTotals(orderId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order additional charge:", error);
      res.status(500).json({ message: "Failed to delete order additional charge" });
    }
  }

  // ── Service Charges ──

  static async listServiceCharges(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const charges = await db.select().from(orderServiceCharges).where(eq(orderServiceCharges.orderId, req.params.projectId));
      res.json(charges);
    } catch (error) {
      console.error("Error fetching service charges:", error);
      res.status(500).json({ message: "Failed to fetch service charges" });
    }
  }

  static async createServiceCharge(req: Request, res: Response) {
    try {
      if (await checkServiceChargeLock(req.params.projectId, res)) return;
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const [charge] = await db.insert(orderServiceCharges).values({
        orderId: req.params.projectId,
        chargeType: req.body.chargeType,
        description: req.body.description,
        quantity: req.body.quantity || 1,
        unitCost: req.body.unitCost || "0",
        unitPrice: req.body.unitPrice || "0",
        taxable: req.body.taxable || false,
        includeInMargin: req.body.includeInMargin || false,
        displayToClient: req.body.displayToClient !== false,
        displayToVendor: req.body.displayToVendor !== false,
        vendorId: req.body.vendorId || null,
        notes: req.body.notes || null,
      }).returning();
      // Recalculate order totals so service charge is reflected in subtotal/tax/total
      await recalculateOrderTotals(req.params.projectId);
      res.status(201).json(charge);
    } catch (error) {
      console.error("Error creating service charge:", error);
      res.status(500).json({ message: "Failed to create service charge" });
    }
  }

  static async updateServiceCharge(req: Request, res: Response) {
    try {
      if (await checkServiceChargeLock(req.params.projectId, res)) return;
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const updateData: any = { updatedAt: new Date() };
      const fields = ['chargeType', 'description', 'quantity', 'unitCost', 'unitPrice', 'taxable', 'includeInMargin', 'displayToClient', 'displayToVendor', 'vendorId', 'notes'];
      fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
      const [charge] = await db.update(orderServiceCharges).set(updateData)
        .where(eq(orderServiceCharges.id, req.params.chargeId)).returning();
      if (!charge) return res.status(404).json({ message: "Service charge not found" });
      // Recalculate order totals so price/qty edits flow into subtotal/tax/total
      await recalculateOrderTotals(req.params.projectId);
      res.json(charge);
    } catch (error) {
      console.error("Error updating service charge:", error);
      res.status(500).json({ message: "Failed to update service charge" });
    }
  }

  static async deleteServiceCharge(req: Request, res: Response) {
    try {
      if (await checkServiceChargeLock(req.params.projectId, res)) return;
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(orderServiceCharges).where(eq(orderServiceCharges.id, req.params.chargeId));
      // Recalculate order totals so removed charge no longer counted
      await recalculateOrderTotals(req.params.projectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service charge:", error);
      res.status(500).json({ message: "Failed to delete service charge" });
    }
  }

  // ── Duplicate Item ──

  static async duplicateItem(req: Request, res: Response) {
    try {
      const { projectId, itemId } = req.params;

      // Lock check
      const parentOrder = await projectRepository.getOrder(projectId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      const { db } = await import("../db");
      const { orderItems, orderItemLines, orderAdditionalCharges, artworkItems } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");

      // 1. Fetch source item
      const [sourceItem] = await db.select().from(orderItems).where(eq(orderItems.id, itemId));
      if (!sourceItem || sourceItem.orderId !== projectId) {
        return res.status(404).json({ message: "Item not found in this project" });
      }

      // 2. Create new item (copy all fields except id/createdAt)
      const { id: _id, createdAt: _ca, ...itemData } = sourceItem;
      const [newItem] = await db.insert(orderItems).values(itemData).returning();

      // 3. Copy lines
      const sourceLines = await db.select().from(orderItemLines).where(eq(orderItemLines.orderItemId, itemId));
      for (const line of sourceLines) {
        const { id: _lid, orderItemId: _oid, createdAt: _lca, updatedAt: _lua, ...lineData } = line;
        await db.insert(orderItemLines).values({ ...lineData, orderItemId: newItem.id });
      }

      // 4. Copy charges
      const sourceCharges = await db.select().from(orderAdditionalCharges).where(eq(orderAdditionalCharges.orderItemId, itemId));
      for (const charge of sourceCharges) {
        const { id: _cid, orderItemId: _coid, createdAt: _cca, updatedAt: _cua, ...chargeData } = charge;
        await db.insert(orderAdditionalCharges).values({ ...chargeData, orderItemId: newItem.id });
      }

      // 5. Copy artwork references (reset proof status)
      const sourceArtworks = await db.select().from(artworkItems).where(eq(artworkItems.orderItemId, itemId));
      for (const art of sourceArtworks) {
        const { id: _aid, orderItemId: _aoid, createdAt: _aca, updatedAt: _aua, ...artData } = art;
        await db.insert(artworkItems).values({
          ...artData,
          orderItemId: newItem.id,
          status: "pending",
          proofFilePath: null,
          proofFileName: null,
        });
      }

      // 6. Recalculate order totals
      await recalculateOrderTotals(projectId);

      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error duplicating order item:", error);
      res.status(500).json({ message: "Failed to duplicate order item" });
    }
  }
}
