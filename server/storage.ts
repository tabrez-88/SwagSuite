import {
  users,
  companies,
  contacts,
  suppliers,
  products,
  orders,
  orderItems,
  artworkFiles,
  activities,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Contact,
  type InsertContact,
  type Supplier,
  type InsertSupplier,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ArtworkFile,
  type InsertArtworkFile,
  type Activity,
  type InsertActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  searchCompanies(query: string): Promise<Company[]>;

  // Contact operations
  getContacts(companyId?: string): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;

  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  getOrdersByCompany(companyId: string): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;

  // Order item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem>;
  deleteOrderItem(id: string): Promise<void>;

  // Artwork operations
  getArtworkFiles(orderId?: string, companyId?: string): Promise<ArtworkFile[]>;
  createArtworkFile(file: InsertArtworkFile): Promise<ArtworkFile>;
  deleteArtworkFile(id: string): Promise<void>;

  // Activity operations
  getActivities(entityType?: string, entityId?: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Analytics operations
  getDashboardStats(): Promise<{
    totalRevenue: number;
    activeOrders: number;
    grossMargin: number;
    customerCount: number;
  }>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  getTeamLeaderboard(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  async searchCompanies(query: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(
        like(companies.name, `%${query}%`)
      )
      .orderBy(desc(companies.createdAt));
  }

  // Contact operations
  async getContacts(companyId?: string): Promise<Contact[]> {
    const query = db.select().from(contacts);
    if (companyId) {
      return await query.where(eq(contacts.companyId, companyId));
    }
    return await query.orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        like(products.name, `%${query}%`)
      )
      .orderBy(desc(products.createdAt));
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Generate order number
    const orderCount = await db.select({ count: sql`count(*)` }).from(orders);
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Number(orderCount[0].count) + 1).padStart(3, '0')}`;
    
    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, orderNumber })
      .returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
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

  // Order item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
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

  // Artwork operations
  async getArtworkFiles(orderId?: string, companyId?: string): Promise<ArtworkFile[]> {
    const query = db.select().from(artworkFiles);
    
    if (orderId && companyId) {
      return await query.where(
        and(eq(artworkFiles.orderId, orderId), eq(artworkFiles.companyId, companyId))
      );
    } else if (orderId) {
      return await query.where(eq(artworkFiles.orderId, orderId));
    } else if (companyId) {
      return await query.where(eq(artworkFiles.companyId, companyId));
    }
    
    return await query.orderBy(desc(artworkFiles.createdAt));
  }

  async createArtworkFile(file: InsertArtworkFile): Promise<ArtworkFile> {
    const [newFile] = await db.insert(artworkFiles).values(file).returning();
    return newFile;
  }

  async deleteArtworkFile(id: string): Promise<void> {
    await db.delete(artworkFiles).where(eq(artworkFiles.id, id));
  }

  // Activity operations
  async getActivities(entityType?: string, entityId?: string): Promise<Activity[]> {
    const query = db.select().from(activities);
    
    if (entityType && entityId) {
      return await query.where(
        and(eq(activities.entityType, entityType), eq(activities.entityId, entityId))
      ).orderBy(desc(activities.createdAt));
    } else if (entityType) {
      return await query.where(eq(activities.entityType, entityType))
        .orderBy(desc(activities.createdAt));
    }
    
    return await query.orderBy(desc(activities.createdAt)).limit(50);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Analytics operations
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    activeOrders: number;
    grossMargin: number;
    customerCount: number;
  }> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Get YTD revenue
    const revenueResult = await db
      .select({ total: sql`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, yearStart),
          eq(orders.status, 'approved' as any)
        )
      );

    // Get active orders count
    const activeOrdersResult = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'in_production' as any));

    // Get customer count
    const customerCountResult = await db
      .select({ count: sql`count(*)` })
      .from(companies);

    // Calculate average margin (simplified)
    const marginResult = await db
      .select({ avgMargin: sql`COALESCE(AVG(${orders.margin}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, yearStart),
          eq(orders.status, 'approved' as any)
        )
      );

    return {
      totalRevenue: Number(revenueResult[0].total) || 0,
      activeOrders: Number(activeOrdersResult[0].count) || 0,
      grossMargin: Number(marginResult[0].avgMargin) || 0,
      customerCount: Number(customerCountResult[0].count) || 0,
    };
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getTeamLeaderboard(): Promise<any[]> {
    // This would be more complex in reality, joining with users and calculating metrics
    // For now, return empty array - would need to implement proper sales tracking
    return [];
  }
}

export const storage = new DatabaseStorage();
