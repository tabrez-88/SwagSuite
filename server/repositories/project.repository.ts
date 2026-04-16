import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  orders,
  orderItems,
  orderItemLines,
  orderAdditionalCharges,
  products,
  companies,
  contacts,
  suppliers,
  users,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderItemLine,
  type InsertOrderItemLine,
  type OrderAdditionalCharge,
  type InsertOrderAdditionalCharge,
} from "@shared/schema";

export class ProjectRepository {
  async getOrders(): Promise<Order[]> {
    const results = await db
      .select({
        // All order fields
        id: orders.id,
        orderNumber: orders.orderNumber,
        companyId: orders.companyId,
        contactId: orders.contactId,
        assignedUserId: orders.assignedUserId,
        status: orders.status,
        orderType: orders.orderType,
        subtotal: orders.subtotal,
        tax: orders.tax,
        shipping: orders.shipping,
        total: orders.total,
        margin: orders.margin,
        inHandsDate: orders.inHandsDate,
        eventDate: orders.eventDate,
        notes: orders.notes,
        customerNotes: orders.customerNotes,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Production stage fields
        currentStage: orders.currentStage,
        stagesCompleted: orders.stagesCompleted,
        stageData: orders.stageData,
        customNotes: orders.customNotes,
        csrUserId: orders.csrUserId,
        // Section-specific statuses for business stage determination
        presentationStatus: orders.presentationStatus,
        salesOrderStatus: orders.salesOrderStatus,
        quoteStatus: orders.quoteStatus,
        orderDiscount: orders.orderDiscount,
        // Related company info
        companyName: companies.name,
        companyEmail: companies.email,
        companyPhone: companies.phone,
        // Related contact info
        contactName: sql<string>`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
        contactEmail: contacts.email,
        contactPhone: contacts.phone,
        // Assigned user info
        assignedUserName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(orders)
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .leftJoin(contacts, eq(orders.contactId, contacts.id))
      .leftJoin(users, eq(orders.assignedUserId, users.id))
      .orderBy(desc(orders.createdAt));

    return results as any;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Generate order number if not provided
    let orderNumber = order.orderNumber;

    if (!orderNumber) {
      const { generateOrderNumber } = await import("../utils/orderNumber");
      orderNumber = await generateOrderNumber();
    }

    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, orderNumber })
      .returning();
    return newOrder;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    console.log(`Storage: Updating order ${id} with:`, orderData);
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    console.log(`Storage: Order ${id} updated result total:`, updatedOrder.total);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrdersByCompany(companyId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.companyId, companyId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status as any))
      .orderBy(desc(orders.createdAt));
  }

  async getProductionOrders(): Promise<any[]> {
    const results = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        companyName: companies.name,
        productName: sql<string>`'Various Products'`, // Placeholder until we aggregate items
        quantity: sql<number>`0`, // Placeholder
        currentStage: orders.status,
        assignedTo: users.firstName,
        dueDate: orders.inHandsDate,
        orderValue: orders.total,
        priority: sql<string>`'medium'`, // Default
        stageData: sql<any>`'{}'::jsonb`,
        customNotes: orders.notes
      })
      .from(orders)
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .leftJoin(users, eq(orders.assignedUserId, users.id))
      .orderBy(desc(orders.createdAt));

    return results;
  }

  // Order item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        supplierId: orderItems.supplierId,
        quantity: orderItems.quantity,
        cost: orderItems.cost,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        decorationCost: orderItems.decorationCost,
        charges: orderItems.charges,
        sizePricing: orderItems.sizePricing,
        color: orderItems.color,
        size: orderItems.size,
        imprintLocation: orderItems.imprintLocation,
        imprintMethod: orderItems.imprintMethod,
        decoratorType: orderItems.decoratorType,
        decoratorId: orderItems.decoratorId,
        priceLabel: orderItems.priceLabel,
        personalComment: orderItems.personalComment,
        description: orderItems.description,
        privateNotes: orderItems.privateNotes,
        notes: orderItems.notes,
        shippingDestination: orderItems.shippingDestination,
        shippingAccountType: orderItems.shippingAccountType,
        shippingMethodOverride: orderItems.shippingMethodOverride,
        shippingNotes: orderItems.shippingNotes,
        shipToAddressId: orderItems.shipToAddressId,
        shipToAddress: orderItems.shipToAddress,
        shipInHandsDate: orderItems.shipInHandsDate,
        shipFirm: orderItems.shipFirm,
        shippingQuote: orderItems.shippingQuote,
        leg2ShipTo: orderItems.leg2ShipTo,
        leg2AddressId: orderItems.leg2AddressId,
        leg2Address: orderItems.leg2Address,
        leg2InHandsDate: orderItems.leg2InHandsDate,
        leg2Firm: orderItems.leg2Firm,
        leg2ShippingMethod: orderItems.leg2ShippingMethod,
        leg2ShippingAccountType: orderItems.leg2ShippingAccountType,
        leg2ShippingQuote: orderItems.leg2ShippingQuote,
        taxCodeId: orderItems.taxCodeId,
        createdAt: orderItems.createdAt,
        // Join product info
        productName: products.name,
        productSku: products.sku,
        productImageUrl: products.imageUrl,
        productColors: products.colors,
        productSizes: products.sizes,
        productBrand: products.brand,
        productDescription: products.description,
        // Join supplier info
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
        supplierPhone: suppliers.phone,
        supplierContactPerson: suppliers.contactPerson,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(suppliers, eq(orderItems.supplierId, suppliers.id))
      .where(eq(orderItems.orderId, orderId));

    return items as any;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem> {
    const [updatedItem] = await db
      .update(orderItems)
      .set(item)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteOrderItem(id: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.id, id));
  }

  // Order item lines
  async getOrderItemLines(orderItemId: string): Promise<OrderItemLine[]> {
    return db
      .select()
      .from(orderItemLines)
      .where(eq(orderItemLines.orderItemId, orderItemId))
      .orderBy(desc(orderItemLines.createdAt));
  }

  async getOrderItemLine(id: string): Promise<OrderItemLine | undefined> {
    const [line] = await db.select().from(orderItemLines).where(eq(orderItemLines.id, id));
    return line;
  }

  async createOrderItemLine(line: InsertOrderItemLine): Promise<OrderItemLine> {
    const [newLine] = await db.insert(orderItemLines).values(line).returning();
    return newLine;
  }

  async updateOrderItemLine(id: string, line: Partial<InsertOrderItemLine>): Promise<OrderItemLine> {
    const [updated] = await db
      .update(orderItemLines)
      .set({ ...line, updatedAt: new Date() })
      .where(eq(orderItemLines.id, id))
      .returning();
    return updated;
  }

  async deleteOrderItemLine(id: string): Promise<void> {
    await db.delete(orderItemLines).where(eq(orderItemLines.id, id));
  }

  // Order Additional Charges
  async getOrderAdditionalCharges(orderItemId: string): Promise<OrderAdditionalCharge[]> {
    return db
      .select()
      .from(orderAdditionalCharges)
      .where(eq(orderAdditionalCharges.orderItemId, orderItemId))
      .orderBy(desc(orderAdditionalCharges.createdAt));
  }

  async createOrderAdditionalCharge(charge: InsertOrderAdditionalCharge): Promise<OrderAdditionalCharge> {
    const [newCharge] = await db.insert(orderAdditionalCharges).values(charge).returning();
    return newCharge;
  }

  async updateOrderAdditionalCharge(id: string, charge: Partial<InsertOrderAdditionalCharge>): Promise<OrderAdditionalCharge> {
    const [updated] = await db
      .update(orderAdditionalCharges)
      .set({ ...charge, updatedAt: new Date() })
      .where(eq(orderAdditionalCharges.id, id))
      .returning();
    return updated;
  }

  async deleteOrderAdditionalCharge(id: string): Promise<void> {
    await db.delete(orderAdditionalCharges).where(eq(orderAdditionalCharges.id, id));
  }
}

export const projectRepository = new ProjectRepository();
