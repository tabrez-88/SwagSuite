import type { Request, Response } from "express";
import { orderRepository } from "../repositories/order.repository";
import { userRepository } from "../repositories/user.repository";
import { activityRepository } from "../repositories/activity.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { settingsRepository } from "../repositories/settings.repository";
import {
  insertOrderSchema,
  insertOrderItemSchema,
  insertOrderItemLineSchema,
  insertOrderAdditionalChargeSchema,
} from "@shared/schema";
import { isSectionLocked, checkLockByOrderItemId } from "../utils/lockHelpers";
import { updateCompanyYtdSpending, updateSupplierYtdSpending } from "../utils/ytdHelpers";
import { registerInMediaLibrary } from "../utils/registerInMediaLibrary";

// ── Helper: recalculate order totals (items + charges + discount + tax + shipping) ──
async function recalculateOrderTotals(orderId: string) {
  const { db } = await import("../db");
  const { orderServiceCharges, orderAdditionalCharges, orderShipments, companies } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const { getTaxJarCredentials } = await import("../services/taxjar.service");

  const allItems = await orderRepository.getOrderItems(orderId);
  const itemsSubtotal = allItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  // Sum per-item additional charges (client-visible)
  let additionalChargesTotal = 0;
  for (const item of allItems) {
    const charges = await db.select().from(orderAdditionalCharges).where(eq(orderAdditionalCharges.orderItemId, item.id));
    additionalChargesTotal += charges
      .filter((c: any) => c.displayToClient)
      .reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0);
  }

  // Sum order-level service charges (client-visible)
  const serviceCharges = await db.select().from(orderServiceCharges).where(eq(orderServiceCharges.orderId, orderId));
  const serviceChargesTotal = serviceCharges
    .filter((c: any) => c.displayToClient)
    .reduce((sum: number, c: any) => {
      const qty = c.quantity || 1;
      const price = parseFloat(c.unitPrice || "0");
      return sum + qty * price;
    }, 0);

  // Sum shipping costs from shipments
  const shipments = await db.select().from(orderShipments).where(eq(orderShipments.orderId, orderId));
  const shippingTotal = shipments.reduce((sum: number, s: any) => sum + parseFloat(s.shippingCost || "0"), 0);

  const subtotal = itemsSubtotal + additionalChargesTotal + serviceChargesTotal;
  const existingOrder = await orderRepository.getOrder(orderId);

  // Discount disabled for now — kept in schema but not applied
  const discountedSubtotal = subtotal;

  // Calculate tax: try TaxJar first, fallback to manual taxRate
  let tax = 0;
  let taxSource = "none";
  const isTaxExempt = await (async () => {
    if (!existingOrder?.companyId) return false;
    const [company] = await db.select().from(companies).where(eq(companies.id, existingOrder.companyId));
    return company?.taxExempt || false;
  })();

  if (!isTaxExempt && discountedSubtotal > 0) {
    // Try TaxJar API
    const taxService = await getTaxJarCredentials();
    if (taxService) {
      try {
        const shippingAddr = (() => {
          try { return existingOrder?.shippingAddress ? JSON.parse(existingOrder.shippingAddress) : null; }
          catch { return null; }
        })();
        if (shippingAddr?.state && shippingAddr?.zipCode) {
          const taxResult = await taxService.calculateTax({
            from_country: "US",
            from_state: "NY",
            from_zip: "10001",
            to_country: shippingAddr.country || "US",
            to_state: shippingAddr.state,
            to_zip: shippingAddr.zipCode,
            to_city: shippingAddr.city || "",
            to_street: shippingAddr.street || shippingAddr.address || "",
            amount: discountedSubtotal,
            shipping: shippingTotal,
            line_items: allItems.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              unit_price: parseFloat(item.unitPrice) || 0,
              discount: 0,
            })),
          });
          tax = taxResult.amount_to_collect;
          taxSource = "taxjar";
        }
      } catch (err) {
        console.warn(`TaxJar calculation failed for order ${orderId}, falling back to manual rate:`, err);
      }
    }
    // Fallback to manual tax rate if TaxJar didn't calculate
    if (taxSource === "none") {
      const manualTaxRate = parseFloat((existingOrder as any)?.taxRate || "0");
      if (manualTaxRate > 0) {
        tax = discountedSubtotal * (manualTaxRate / 100);
        taxSource = "manual";
      }
    }
  }

  const total = discountedSubtotal + shippingTotal + tax;

  console.log(`Recalculation for order ${orderId}:`, {
    itemsSubtotal: itemsSubtotal.toFixed(2),
    additionalCharges: additionalChargesTotal.toFixed(2),
    serviceCharges: serviceChargesTotal.toFixed(2),
    subtotal: subtotal.toFixed(2),
    discount: "disabled",
    tax: `${tax.toFixed(2)} (${taxSource})`,
    shipping: shippingTotal.toFixed(2),
    total: total.toFixed(2),
  });

  const updatedOrder = await orderRepository.updateOrder(orderId, {
    subtotal: subtotal.toFixed(2),
    shipping: shippingTotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    taxCalculatedAt: taxSource !== "none" ? new Date() : undefined,
  } as any);

  // Update YTD spending
  if (updatedOrder.companyId) {
    await updateCompanyYtdSpending(updatedOrder.companyId);
  }
  const items = await orderRepository.getOrderItems(updatedOrder.id);
  const supplierIds = Array.from(new Set(items.map(item => item.supplierId).filter(Boolean)));
  for (const supplierId of supplierIds) {
    if (supplierId) {
      await updateSupplierYtdSpending(supplierId as string);
    }
  }

  return updatedOrder;
}

// ── Helper: recalculate parent item totalPrice/quantity from its lines ──
async function recalculateItemFromLines(orderItemId: string) {
  const lines = await orderRepository.getOrderItemLines(orderItemId);
  if (lines.length === 0) return;
  const totalQty = lines.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const totalPrice = lines.reduce((sum, l) => {
    const qty = l.quantity || 0;
    const price = parseFloat(l.unitPrice || "0");
    return sum + qty * price;
  }, 0);
  await orderRepository.updateOrderItem(orderItemId, {
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
  const order = await orderRepository.getOrder(orderId);
  if (order && isSectionLocked(order, 'salesOrder')) {
    res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
    return true;
  }
  return false;
}

export class OrderController {

  // ── Orders CRUD ──

  static async list(req: Request, res: Response) {
    try {
      const status = req.query.status as string;
      const companyId = req.query.companyId as string;

      let orders;
      if (status) {
        orders = await orderRepository.getOrdersByStatus(status);
      } else if (companyId) {
        orders = await orderRepository.getOrdersByCompany(companyId);
      } else {
        orders = await orderRepository.getOrders();
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const order = await orderRepository.getOrder(req.params.id);
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

      const order = await orderRepository.createOrder(validatedData);

      // Create order items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await orderRepository.createOrderItem({
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
      const oldOrder = await orderRepository.getOrder(req.params.id);

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

      const order = await orderRepository.updateOrder(req.params.id, validatedData);

      // Handle order items if provided
      if (items && Array.isArray(items)) {
        // Get existing order items
        const existingItems = await orderRepository.getOrderItems(order.id);
        const existingItemIds = new Set(existingItems.map(item => item.id));

        // Process each item from the request
        for (const item of items) {
          // If item has an ID and exists in database, update it
          if (item.id && !item.id.toString().startsWith('temp-') && existingItemIds.has(item.id)) {
            await orderRepository.updateOrderItem(item.id, {
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
            await orderRepository.createOrderItem({
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
            await orderRepository.updateOrder(order.id, { stageData: updatedStageData } as any);
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

      // Update YTD spending for all suppliers from order items
      const currentItems = await orderRepository.getOrderItems(order.id);
      const currentSupplierIds = Array.from(new Set(currentItems.map(item => item.supplierId).filter(Boolean)));
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
      const pricingFields = ['orderDiscount', 'taxRate', 'shippingAddress', 'billingAddress'];
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
      const { orderId } = req.params;
      const { db } = await import("../db");
      const { orders, orderItems, artworkItems, orderAdditionalCharges, orderServiceCharges } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");

      // Get source order
      const [sourceOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!sourceOrder) return res.status(404).json({ message: "Order not found" });

      // Get source items
      const sourceItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      // Generate new order number
      const year = new Date().getFullYear();
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM orders WHERE order_number LIKE 'ORD-${year}-%'`));
      const countRows = (countResult as any).rows ?? countResult;
      const nextNum = parseInt(countRows[0]?.count || "0") + 1;
      const newOrderNumber = `ORD-${year}-${String(nextNum).padStart(3, "0")}`;

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
      const sourceServiceCharges = await db.select().from(orderServiceCharges).where(eq(orderServiceCharges.orderId, orderId));
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
        metadata: { action: "order_duplicated", sourceOrderId: orderId, sourceOrderNumber: sourceOrder.orderNumber },
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

  // ── Order Items ──

  static async listItems(req: Request, res: Response) {
    try {
      const items = await orderRepository.getOrderItems(req.params.orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  }

  static async createItem(req: Request, res: Response) {
    try {
      // Lock check
      const parentOrder = await orderRepository.getOrder(req.params.orderId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      // If supplierId is not provided, get it from the product
      let dataToInsert = {
        ...req.body,
        orderId: req.params.orderId,
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
                eq(vendorApprovalRequests.orderId, req.params.orderId),
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

      const item = await orderRepository.createOrderItem(validatedData);

      // Recalculate order totals (includes discount, tax, shipping)
      await recalculateOrderTotals(req.params.orderId);

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  }

  static async deleteItem(req: Request, res: Response) {
    try {
      // Lock check
      const parentOrder = await orderRepository.getOrder(req.params.orderId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      // First, delete any artwork approvals associated with this order item
      // This prevents foreign key constraint violations
      const { db } = await import("../db");
      const { artworkApprovals } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await db.delete(artworkApprovals).where(eq(artworkApprovals.orderItemId, req.params.itemId));

      // Now safe to delete the order item
      await orderRepository.deleteOrderItem(req.params.itemId);

      // Recalculate order totals (includes discount, tax, shipping)
      await recalculateOrderTotals(req.params.orderId);

      res.json({ message: "Order item deleted successfully" });
    } catch (error) {
      console.error("Error deleting order item:", error);
      res.status(500).json({ message: "Failed to delete order item" });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      // Lock check
      const parentOrder = await orderRepository.getOrder(req.params.orderId);
      if (parentOrder && isSectionLocked(parentOrder, 'salesOrder')) {
        return res.status(403).json({ message: "Sales Order is locked. Unlock it first to make changes." });
      }

      // Minimum margin check on pricing updates
      if (req.body.unitPrice !== undefined && req.body.cost !== undefined) {
        const price = parseFloat(req.body.unitPrice);
        const cost = parseFloat(req.body.cost);
        if (price > 0) {
          const margin = ((price - cost) / price) * 100;
          const settings = await settingsRepository.getCompanySettings();
          const minMargin = parseFloat(settings?.minimumMargin || "15");
          if (margin > 0 && margin < minMargin) {
            // Include warning in response but allow save (client handles confirmation)
            const updatedItem = await orderRepository.updateOrderItem(req.params.itemId, req.body);
            const pricingFields = ['quantity', 'unitPrice', 'totalPrice', 'cost', 'decorationCost', 'charges'];
            if (pricingFields.some(f => req.body[f] !== undefined)) {
              await recalculateOrderTotals(req.params.orderId);
            }
            return res.json({ ...updatedItem, _marginWarning: { margin: margin.toFixed(1), minimumMargin: minMargin } });
          }
        }
      }

      const updatedItem = await orderRepository.updateOrderItem(req.params.itemId, req.body);

      // Recalculate order totals if pricing fields changed
      const pricingFields = ['quantity', 'unitPrice', 'totalPrice', 'cost', 'decorationCost', 'charges'];
      if (pricingFields.some(f => req.body[f] !== undefined)) {
        await recalculateOrderTotals(req.params.orderId);
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
        .where(eq(artworkItems.orderItemId, req.params.orderItemId));

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

      const artworkData = {
        orderItemId: req.params.orderItemId,
        name: req.body.name,
        artworkType: req.body.artworkType || null,
        location: req.body.location || null,
        color: req.body.color || null,
        size: req.body.size || null,
        status: req.body.status || 'pending',
        fileName: fileName,
        filePath: filePath,
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
            orderItemId: req.params.orderItemId,
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

      const [artwork] = await db
        .update(artworkItems)
        .set(updateData)
        .where(
          and(
            eq(artworkItems.id, req.params.artworkId),
            eq(artworkItems.orderItemId, req.params.orderItemId)
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
      const { artworkItems } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(artworkItems)
        .where(
          and(
            eq(artworkItems.id, req.params.artworkId),
            eq(artworkItems.orderItemId, req.params.orderItemId)
          )
        );

      res.json({ message: "Artwork deleted successfully" });
    } catch (error) {
      console.error("Error deleting artwork item:", error);
      res.status(500).json({ message: "Failed to delete artwork item" });
    }
  }

  // ── Order Item Lines ──

  static async listLines(req: Request, res: Response) {
    try {
      const lines = await orderRepository.getOrderItemLines(req.params.orderItemId);
      res.json(lines);
    } catch (error) {
      console.error("Error fetching order item lines:", error);
      res.status(500).json({ message: "Failed to fetch order item lines" });
    }
  }

  static async createLine(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.orderItemId, res)) return;
      const validatedData = insertOrderItemLineSchema.parse({
        ...req.body,
        orderItemId: req.params.orderItemId,
      });
      const line = await orderRepository.createOrderItemLine(validatedData);
      await recalculateItemFromLines(req.params.orderItemId);
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating order item line:", error);
      res.status(500).json({ message: "Failed to create order item line" });
    }
  }

  static async updateLine(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.orderItemId, res)) return;

      // Minimum margin check on line pricing updates
      if (req.body.unitPrice !== undefined && req.body.cost !== undefined) {
        const price = parseFloat(req.body.unitPrice);
        const cost = parseFloat(req.body.cost);
        if (price > 0) {
          const margin = ((price - cost) / price) * 100;
          const settings = await settingsRepository.getCompanySettings();
          const minMargin = parseFloat(settings?.minimumMargin || "15");
          if (margin > 0 && margin < minMargin) {
            const line = await orderRepository.updateOrderItemLine(req.params.lineId, req.body);
            await recalculateItemFromLines(req.params.orderItemId);
            return res.json({ ...line, _marginWarning: { margin: margin.toFixed(1), minimumMargin: minMargin } });
          }
        }
      }

      const line = await orderRepository.updateOrderItemLine(req.params.lineId, req.body);
      await recalculateItemFromLines(req.params.orderItemId);
      res.json(line);
    } catch (error) {
      console.error("Error updating order item line:", error);
      res.status(500).json({ message: "Failed to update order item line" });
    }
  }

  static async deleteLine(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.orderItemId, res)) return;
      await orderRepository.deleteOrderItemLine(req.params.lineId);
      await recalculateItemFromLines(req.params.orderItemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order item line:", error);
      res.status(500).json({ message: "Failed to delete order item line" });
    }
  }

  // ── Order Additional Charges ──

  static async listCharges(req: Request, res: Response) {
    try {
      const charges = await orderRepository.getOrderAdditionalCharges(req.params.orderItemId);
      res.json(charges);
    } catch (error) {
      console.error("Error fetching order additional charges:", error);
      res.status(500).json({ message: "Failed to fetch order additional charges" });
    }
  }

  static async createCharge(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.orderItemId, res)) return;
      const validatedData = insertOrderAdditionalChargeSchema.parse({
        ...req.body,
        orderItemId: req.params.orderItemId,
      });
      const charge = await orderRepository.createOrderAdditionalCharge(validatedData);
      res.status(201).json(charge);
    } catch (error) {
      console.error("Error creating order additional charge:", error);
      res.status(500).json({ message: "Failed to create order additional charge" });
    }
  }

  static async updateCharge(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.orderItemId, res)) return;
      const charge = await orderRepository.updateOrderAdditionalCharge(req.params.chargeId, req.body);
      res.json(charge);
    } catch (error) {
      console.error("Error updating order additional charge:", error);
      res.status(500).json({ message: "Failed to update order additional charge" });
    }
  }

  static async deleteCharge(req: Request, res: Response) {
    try {
      if (await checkLockByOrderItemId(req.params.orderItemId, res)) return;
      await orderRepository.deleteOrderAdditionalCharge(req.params.chargeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order additional charge:", error);
      res.status(500).json({ message: "Failed to delete order additional charge" });
    }
  }

  // ── Order Service Charges ──

  static async listServiceCharges(req: Request, res: Response) {
    try {
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const charges = await db.select().from(orderServiceCharges).where(eq(orderServiceCharges.orderId, req.params.orderId));
      res.json(charges);
    } catch (error) {
      console.error("Error fetching service charges:", error);
      res.status(500).json({ message: "Failed to fetch service charges" });
    }
  }

  static async createServiceCharge(req: Request, res: Response) {
    try {
      if (await checkServiceChargeLock(req.params.orderId, res)) return;
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const [charge] = await db.insert(orderServiceCharges).values({
        orderId: req.params.orderId,
        chargeType: req.body.chargeType,
        description: req.body.description,
        quantity: req.body.quantity || 1,
        unitCost: req.body.unitCost || "0",
        unitPrice: req.body.unitPrice || "0",
        taxable: req.body.taxable || false,
        includeInMargin: req.body.includeInMargin || false,
        displayToClient: req.body.displayToClient !== false,
        vendorId: req.body.vendorId || null,
        notes: req.body.notes || null,
      }).returning();
      res.status(201).json(charge);
    } catch (error) {
      console.error("Error creating service charge:", error);
      res.status(500).json({ message: "Failed to create service charge" });
    }
  }

  static async updateServiceCharge(req: Request, res: Response) {
    try {
      if (await checkServiceChargeLock(req.params.orderId, res)) return;
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const updateData: any = { updatedAt: new Date() };
      const fields = ['chargeType', 'description', 'quantity', 'unitCost', 'unitPrice', 'taxable', 'includeInMargin', 'displayToClient', 'vendorId', 'notes'];
      fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
      const [charge] = await db.update(orderServiceCharges).set(updateData)
        .where(eq(orderServiceCharges.id, req.params.chargeId)).returning();
      if (!charge) return res.status(404).json({ message: "Service charge not found" });
      res.json(charge);
    } catch (error) {
      console.error("Error updating service charge:", error);
      res.status(500).json({ message: "Failed to update service charge" });
    }
  }

  static async deleteServiceCharge(req: Request, res: Response) {
    try {
      if (await checkServiceChargeLock(req.params.orderId, res)) return;
      const { db } = await import("../db");
      const { orderServiceCharges } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(orderServiceCharges).where(eq(orderServiceCharges.id, req.params.chargeId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service charge:", error);
      res.status(500).json({ message: "Failed to delete service charge" });
    }
  }
}
