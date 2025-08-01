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
  dataUploads,
  artworkColumns,
  artworkCards,
  presentations,
  presentationFiles,
  presentationProducts,
  slackMessages,
  ssActivewearProducts,
  ssActivewearImportJobs,
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
  type DataUpload,
  type InsertDataUpload,
  type ArtworkColumn,
  type InsertArtworkColumn,
  type ArtworkCard,
  type InsertArtworkCard,
  type Presentation,
  type InsertPresentation,
  type PresentationFile,
  type InsertPresentationFile,
  type PresentationProduct,
  type InsertPresentationProduct,
  type SlackMessage,
  type InsertSlackMessage,
  type SsActivewearProduct,
  type InsertSsActivewearProduct,
  type SsActivewearImportJob,
  type InsertSsActivewearImportJob,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, gte, lte, sql, or, ilike } from "drizzle-orm";

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
  
  // Data Upload operations
  createDataUpload(upload: InsertDataUpload): Promise<DataUpload>;
  getDataUploads(): Promise<DataUpload[]>;
  updateDataUpload(id: string, updates: Partial<DataUpload>): Promise<DataUpload>;
  deleteDataUpload(id: string): Promise<void>;

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

  // Artwork Kanban management
  getArtworkColumns(): Promise<ArtworkColumn[]>;
  initializeArtworkColumns(columns: any[]): Promise<ArtworkColumn[]>;
  createArtworkColumn(column: InsertArtworkColumn): Promise<ArtworkColumn>;
  getArtworkCards(): Promise<any[]>;
  createArtworkCard(card: InsertArtworkCard): Promise<ArtworkCard>;
  moveArtworkCard(cardId: string, columnId: string, position: number): Promise<ArtworkCard>;

  // Search functionality
  searchCompanies(query: string): Promise<Company[]>;
  searchProducts(query: string): Promise<Product[]>;

  // AI Presentation Builder operations
  getPresentations(userId: string): Promise<Presentation[]>;
  getPresentation(id: string): Promise<Presentation | undefined>;
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  updatePresentation(id: string, presentation: Partial<InsertPresentation>): Promise<Presentation>;
  deletePresentation(id: string): Promise<void>;
  
  createPresentationFile(file: InsertPresentationFile): Promise<PresentationFile>;
  getPresentationFiles(presentationId: string): Promise<PresentationFile[]>;
  
  createPresentationProduct(product: InsertPresentationProduct): Promise<PresentationProduct>;
  getPresentationProducts(presentationId: string): Promise<PresentationProduct[]>;
  
  // Slack Message operations
  getSlackMessages(): Promise<SlackMessage[]>;
  createSlackMessage(message: InsertSlackMessage): Promise<SlackMessage>;
  
  // S&S Activewear operations
  getSsActivewearProducts(): Promise<SsActivewearProduct[]>;
  getSsActivewearProductBySku(sku: string): Promise<SsActivewearProduct | undefined>;
  createSsActivewearProduct(product: InsertSsActivewearProduct): Promise<SsActivewearProduct>;
  updateSsActivewearProduct(id: string, product: Partial<InsertSsActivewearProduct>): Promise<SsActivewearProduct>;
  deleteSsActivewearProduct(id: string): Promise<void>;
  searchSsActivewearProducts(query: string): Promise<SsActivewearProduct[]>;
  
  // S&S Activewear Import Job operations
  getSsActivewearImportJobs(userId?: string): Promise<SsActivewearImportJob[]>;
  getSsActivewearImportJob(id: string): Promise<SsActivewearImportJob | undefined>;
  createSsActivewearImportJob(job: InsertSsActivewearImportJob): Promise<SsActivewearImportJob>;
  updateSsActivewearImportJob(id: string, job: Partial<InsertSsActivewearImportJob>): Promise<SsActivewearImportJob>;
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

  // Data Upload operations
  async createDataUpload(upload: InsertDataUpload): Promise<DataUpload> {
    const [newUpload] = await db.insert(dataUploads).values(upload).returning();
    return newUpload;
  }

  async getDataUploads(): Promise<DataUpload[]> {
    return await db.select().from(dataUploads).orderBy(desc(dataUploads.createdAt));
  }

  async updateDataUpload(id: string, updates: Partial<DataUpload>): Promise<DataUpload> {
    const [updatedUpload] = await db
      .update(dataUploads)
      .set(updates)
      .where(eq(dataUploads.id, id))
      .returning();
    return updatedUpload;
  }

  async deleteDataUpload(id: string): Promise<void> {
    await db.delete(dataUploads).where(eq(dataUploads.id, id));
  }

  // Artwork Kanban management methods
  async getArtworkColumns(): Promise<ArtworkColumn[]> {
    return await db.select().from(artworkColumns).orderBy(artworkColumns.position);
  }

  async initializeArtworkColumns(columns: any[]): Promise<ArtworkColumn[]> {
    const insertColumns = columns.map(col => ({
      id: col.id,
      name: col.name,
      position: col.position,
      color: col.color,
      isDefault: col.isDefault
    }));
    
    return await db.insert(artworkColumns).values(insertColumns).returning();
  }

  async createArtworkColumn(column: InsertArtworkColumn): Promise<ArtworkColumn> {
    const [newColumn] = await db.insert(artworkColumns).values(column).returning();
    return newColumn;
  }

  async getArtworkCards(): Promise<any[]> {
    const cards = await db
      .select({
        id: artworkCards.id,
        title: artworkCards.title,
        description: artworkCards.description,
        columnId: artworkCards.columnId,
        orderId: artworkCards.orderId,
        companyId: artworkCards.companyId,
        assignedUserId: artworkCards.assignedUserId,
        position: artworkCards.position,
        priority: artworkCards.priority,
        dueDate: artworkCards.dueDate,
        labels: artworkCards.labels,
        attachments: artworkCards.attachments,
        checklist: artworkCards.checklist,
        comments: artworkCards.comments,
        createdAt: artworkCards.createdAt,
        updatedAt: artworkCards.updatedAt,
        orderNumber: orders.orderNumber,
        companyName: companies.name,
        assignedUserName: users.firstName
      })
      .from(artworkCards)
      .leftJoin(orders, eq(artworkCards.orderId, orders.id))
      .leftJoin(companies, eq(artworkCards.companyId, companies.id))
      .leftJoin(users, eq(artworkCards.assignedUserId, users.id))
      .orderBy(artworkCards.position);

    return cards;
  }

  async createArtworkCard(card: InsertArtworkCard): Promise<ArtworkCard> {
    const [newCard] = await db.insert(artworkCards).values(card).returning();
    return newCard;
  }

  async moveArtworkCard(cardId: string, columnId: string, position: number): Promise<ArtworkCard> {
    const [updatedCard] = await db
      .update(artworkCards)
      .set({ columnId, position, updatedAt: new Date() })
      .where(eq(artworkCards.id, cardId))
      .returning();
    return updatedCard;
  }

  // Seed dummy data method
  async seedDummyData(): Promise<void> {
    console.log("Starting seedDummyData method...");
    // Sample companies
    const sampleCompanies = [
      {
        name: 'TechCorp Solutions',
        industry: 'Technology',
        website: 'https://techcorp.com',
        phone: '(555) 123-4567',
        email: 'contact@techcorp.com',
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'GreenEarth Marketing',
        industry: 'Marketing',
        website: 'https://greenearth.com',
        phone: '(555) 234-5678',
        email: 'hello@greenearth.com',
        address: '456 Eco Avenue',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Metro Healthcare',
        industry: 'Healthcare',
        website: 'https://metrohealthcare.com',
        phone: '(555) 345-6789',
        email: 'admin@metrohealthcare.com',
        address: '789 Medical Drive',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Summit Financial',
        industry: 'Finance',
        website: 'https://summitfinancial.com',
        phone: '(555) 456-7890',
        email: 'info@summitfinancial.com',
        address: '321 Wall Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10005',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Creative Studios LLC',
        industry: 'Creative Services',
        website: 'https://creativestudios.com',
        phone: '(555) 567-8901',
        email: 'studio@creativestudios.com',
        address: '654 Artist Lane',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'NextGen Robotics',
        industry: 'Robotics',
        website: 'https://nextgenrobotics.com',
        phone: '(555) 678-9012',
        email: 'info@nextgenrobotics.com',
        address: '987 Innovation Drive',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Ocean Blue Consulting',
        industry: 'Consulting',
        website: 'https://oceanblue.com',
        phone: '(555) 789-0123',
        email: 'contact@oceanblue.com',
        address: '147 Coastal Road',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Mountain Peak Adventures',
        industry: 'Tourism',
        website: 'https://mountainpeak.com',
        phone: '(555) 890-1234',
        email: 'adventures@mountainpeak.com',
        address: '258 Alpine Way',
        city: 'Denver',
        state: 'CO',
        zipCode: '80201',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Urban Eats Restaurant Group',
        industry: 'Food & Beverage',
        website: 'https://urbaneats.com',
        phone: '(555) 901-2345',
        email: 'corporate@urbaneats.com',
        address: '369 Culinary Street',
        city: 'Las Vegas',
        state: 'NV',
        zipCode: '89101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Bright Future Education',
        industry: 'Education',
        website: 'https://brightfuture.edu',
        phone: '(555) 012-3456',
        email: 'admin@brightfuture.edu',
        address: '741 Learning Lane',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Solar Systems Inc',
        industry: 'Energy',
        website: 'https://solarsystems.com',
        phone: '(555) 123-7890',
        email: 'info@solarsystems.com',
        address: '852 Energy Boulevard',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Diamond Jewelry Co',
        industry: 'Retail',
        website: 'https://diamondjewelry.com',
        phone: '(555) 234-8901',
        email: 'sales@diamondjewelry.com',
        address: '963 Luxury Avenue',
        city: 'Beverly Hills',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Fitness First Gyms',
        industry: 'Fitness',
        website: 'https://fitnessfirst.com',
        phone: '(555) 345-9012',
        email: 'membership@fitnessfirst.com',
        address: '159 Workout Way',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30301',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Pet Paradise Veterinary',
        industry: 'Veterinary',
        website: 'https://petparadise.com',
        phone: '(555) 456-0123',
        email: 'care@petparadise.com',
        address: '357 Animal Lane',
        city: 'Sacramento',
        state: 'CA',
        zipCode: '94203',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Cloud Nine Software',
        industry: 'Software',
        website: 'https://cloudnine.com',
        phone: '(555) 567-1234',
        email: 'dev@cloudnine.com',
        address: '468 Code Street',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Fresh Garden Organics',
        industry: 'Agriculture',
        website: 'https://freshgarden.com',
        phone: '(555) 678-2345',
        email: 'orders@freshgarden.com',
        address: '579 Farm Road',
        city: 'Des Moines',
        state: 'IA',
        zipCode: '50301',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Steel Works Manufacturing',
        industry: 'Manufacturing',
        website: 'https://steelworks.com',
        phone: '(555) 789-3456',
        email: 'production@steelworks.com',
        address: '680 Industrial Park',
        city: 'Pittsburgh',
        state: 'PA',
        zipCode: '15201',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Coastal Real Estate',
        industry: 'Real Estate',
        website: 'https://coastalrealty.com',
        phone: '(555) 890-4567',
        email: 'listings@coastalrealty.com',
        address: '791 Beachfront Drive',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Law Offices of Smith & Associates',
        industry: 'Legal',
        website: 'https://smithlaw.com',
        phone: '(555) 901-5678',
        email: 'partners@smithlaw.com',
        address: '802 Justice Boulevard',
        city: 'Washington',
        state: 'DC',
        zipCode: '20001',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Premier Auto Dealership',
        industry: 'Automotive',
        website: 'https://premierauto.com',
        phone: '(555) 012-6789',
        email: 'sales@premierauto.com',
        address: '913 Motor Mile',
        city: 'Detroit',
        state: 'MI',
        zipCode: '48201',
        country: 'USA',
        status: 'active' as const
      }
    ];

    // Sample suppliers
    const sampleSuppliers = [
      {
        name: 'PromoWear International',
        contactPerson: 'James Wilson',
        email: 'james@promowear.com',
        phone: '(800) 555-1234',
        address: '100 Industrial Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90028',
        country: 'USA',
        website: 'https://promowear.com',
        paymentTerms: 'Net 30',
        leadTime: 7,
        rating: 4.5
      },
      {
        name: 'Custom Print Solutions',
        contactPerson: 'Lisa Thompson',
        email: 'lisa@customprint.com',
        phone: '(800) 555-2345',
        address: '200 Manufacturing Way',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'USA',
        website: 'https://customprint.com',
        paymentTerms: 'Net 15',
        leadTime: 5,
        rating: 4.8
      },
      {
        name: 'Elite Embroidery Co',
        contactPerson: 'Maria Garcia',
        email: 'maria@eliteembroidery.com',
        phone: '(800) 555-3456',
        address: '300 Stitch Street',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        country: 'USA',
        website: 'https://eliteembroidery.com',
        paymentTerms: 'Net 30',
        leadTime: 10,
        rating: 4.3
      },
      {
        name: 'Precision Engraving Services',
        contactPerson: 'Robert Kim',
        email: 'robert@precisionengraving.com',
        phone: '(800) 555-4567',
        address: '400 Laser Lane',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30301',
        country: 'USA',
        website: 'https://precisionengraving.com',
        paymentTerms: 'Net 15',
        leadTime: 3,
        rating: 4.9
      },
      {
        name: 'Bulk Promotional Items',
        contactPerson: 'Jennifer Davis',
        email: 'jennifer@bulkpromo.com',
        phone: '(800) 555-5678',
        address: '500 Wholesale Way',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        website: 'https://bulkpromo.com',
        paymentTerms: 'Net 45',
        leadTime: 14,
        rating: 4.2
      },
      {
        name: 'TechGadget Distributors',
        contactPerson: 'David Chen',
        email: 'david@techgadget.com',
        phone: '(800) 555-6789',
        address: '600 Technology Boulevard',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95101',
        country: 'USA',
        website: 'https://techgadget.com',
        paymentTerms: 'Net 30',
        leadTime: 21,
        rating: 4.6
      },
      {
        name: 'Eco-Friendly Products LLC',
        contactPerson: 'Sarah Green',
        email: 'sarah@ecofriendly.com',
        phone: '(800) 555-7890',
        address: '700 Sustainable Street',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        country: 'USA',
        website: 'https://ecofriendly.com',
        paymentTerms: 'Net 30',
        leadTime: 12,
        rating: 4.7
      },
      {
        name: 'Corporate Gifts Unlimited',
        contactPerson: 'Michael Brown',
        email: 'michael@corpgifts.com',
        phone: '(800) 555-8901',
        address: '800 Executive Drive',
        city: 'New York',
        state: 'NY',
        zipCode: '10005',
        country: 'USA',
        website: 'https://corpgifts.com',
        paymentTerms: 'Net 15',
        leadTime: 7,
        rating: 4.4
      },
      {
        name: 'Sports Merchandise Pro',
        contactPerson: 'Amanda Johnson',
        email: 'amanda@sportsmerchandise.com',
        phone: '(800) 555-9012',
        address: '900 Athletic Avenue',
        city: 'Denver',
        state: 'CO',
        zipCode: '80201',
        country: 'USA',
        website: 'https://sportsmerchandise.com',
        paymentTerms: 'Net 30',
        leadTime: 8,
        rating: 4.5
      },
      {
        name: 'Premium Packaging Solutions',
        contactPerson: 'Kevin Lee',
        email: 'kevin@premiumpackaging.com',
        phone: '(800) 555-0123',
        address: '1000 Package Place',
        city: 'Memphis',
        state: 'TN',
        zipCode: '38101',
        country: 'USA',
        website: 'https://premiumpackaging.com',
        paymentTerms: 'Net 45',
        leadTime: 15,
        rating: 4.1
      }
    ];

    // Insert companies
    const insertedCompanies = await db.insert(companies).values(sampleCompanies).onConflictDoNothing().returning();
    
    // Insert suppliers
    const insertedSuppliers = await db.insert(suppliers).values(sampleSuppliers).onConflictDoNothing().returning();

    // Sample products with variety
    const sampleProducts = [
      {
        name: 'Classic Cotton T-Shirt',
        sku: 'TEE-001',
        supplierId: insertedSuppliers[0]?.id || 'default-supplier',
        description: 'High-quality 100% cotton t-shirt, perfect for promotional events',
        unitPrice: 8.50,
        costPrice: 4.25,
        inStock: 500,
        leadTime: 7
      },
      {
        name: 'Custom Coffee Mug',
        sku: 'MUG-001',
        supplierId: insertedSuppliers[1]?.id || 'default-supplier',
        description: '11oz ceramic coffee mug with custom printing',
        unitPrice: 6.75,
        costPrice: 3.25,
        inStock: 250,
        leadTime: 5
      },
      {
        name: 'Branded Tote Bag',
        sku: 'BAG-001',
        supplierId: insertedSuppliers[0]?.id || 'default-supplier',
        description: 'Eco-friendly canvas tote bag with custom logo',
        unitPrice: 12.00,
        costPrice: 6.50,
        inStock: 150,
        leadTime: 10
      },
      {
        name: 'Wireless Phone Charger',
        sku: 'TECH-001',
        supplierId: insertedSuppliers[5]?.id || 'default-supplier',
        description: 'Qi-compatible wireless charging pad with custom branding',
        unitPrice: 25.00,
        costPrice: 12.50,
        inStock: 75,
        leadTime: 21
      },
      {
        name: 'Embroidered Polo Shirt',
        sku: 'POLO-001',
        supplierId: insertedSuppliers[2]?.id || 'default-supplier',
        description: 'Professional polo shirt with embroidered logo',
        unitPrice: 18.50,
        costPrice: 9.25,
        inStock: 200,
        leadTime: 10
      },
      {
        name: 'Stainless Steel Water Bottle',
        sku: 'BTL-001',
        supplierId: insertedSuppliers[3]?.id || 'default-supplier',
        description: '32oz insulated water bottle with laser engraving',
        unitPrice: 22.00,
        costPrice: 11.00,
        inStock: 100,
        leadTime: 3
      },
      {
        name: 'Eco-Friendly Notebook',
        sku: 'NOTE-001',
        supplierId: insertedSuppliers[6]?.id || 'default-supplier',
        description: 'Recycled paper notebook with sustainable binding',
        unitPrice: 8.00,
        costPrice: 4.00,
        inStock: 300,
        leadTime: 12
      },
      {
        name: 'Executive Pen Set',
        sku: 'PEN-001',
        supplierId: insertedSuppliers[7]?.id || 'default-supplier',
        description: 'Premium metal pen set in gift box',
        unitPrice: 35.00,
        costPrice: 17.50,
        inStock: 50,
        leadTime: 7
      },
      {
        name: 'Sports Drawstring Bag',
        sku: 'SPORT-001',
        supplierId: insertedSuppliers[8]?.id || 'default-supplier',
        description: 'Durable polyester drawstring bag for athletics',
        unitPrice: 4.50,
        costPrice: 2.25,
        inStock: 400,
        leadTime: 8
      },
      {
        name: 'Premium Gift Box',
        sku: 'BOX-001',
        supplierId: insertedSuppliers[9]?.id || 'default-supplier',
        description: 'Luxury packaging box with custom printing',
        unitPrice: 15.00,
        costPrice: 7.50,
        inStock: 80,
        leadTime: 15
      },
      {
        name: 'Fleece Jacket',
        sku: 'JACKET-001',
        supplierId: insertedSuppliers[0]?.id || 'default-supplier',
        description: 'Soft fleece jacket with embroidered logo',
        unitPrice: 42.00,
        costPrice: 21.00,
        inStock: 60,
        leadTime: 14
      },
      {
        name: 'USB Flash Drive',
        sku: 'USB-001',
        supplierId: insertedSuppliers[5]?.id || 'default-supplier',
        description: '16GB USB drive with custom logo printing',
        unitPrice: 12.50,
        costPrice: 6.25,
        inStock: 200,
        leadTime: 21
      },
      {
        name: 'Desk Calendar',
        sku: 'CAL-001',
        supplierId: insertedSuppliers[1]?.id || 'default-supplier',
        description: '12-month desk calendar with custom photography',
        unitPrice: 9.00,
        costPrice: 4.50,
        inStock: 150,
        leadTime: 5
      },
      {
        name: 'Travel Mug',
        sku: 'TRAVEL-001',
        supplierId: insertedSuppliers[3]?.id || 'default-supplier',
        description: '16oz insulated travel mug with laser engraving',
        unitPrice: 16.50,
        costPrice: 8.25,
        inStock: 120,
        leadTime: 3
      },
      {
        name: 'Laptop Sleeve',
        sku: 'SLEEVE-001',
        supplierId: insertedSuppliers[4]?.id || 'default-supplier',
        description: 'Padded laptop sleeve for 15" laptops',
        unitPrice: 28.00,
        costPrice: 14.00,
        inStock: 85,
        leadTime: 14
      },
      {
        name: 'Stress Ball',
        sku: 'STRESS-001',
        supplierId: insertedSuppliers[4]?.id || 'default-supplier',
        description: 'Foam stress ball in custom shapes and colors',
        unitPrice: 2.50,
        costPrice: 1.25,
        inStock: 1000,
        leadTime: 14
      },
      {
        name: 'Bluetooth Speaker',
        sku: 'SPEAKER-001',
        supplierId: insertedSuppliers[5]?.id || 'default-supplier',
        description: 'Portable Bluetooth speaker with custom branding',
        unitPrice: 45.00,
        costPrice: 22.50,
        inStock: 40,
        leadTime: 21
      },
      {
        name: 'Recycled Mousepad',
        sku: 'PAD-001',
        supplierId: insertedSuppliers[6]?.id || 'default-supplier',
        description: 'Eco-friendly mousepad made from recycled materials',
        unitPrice: 3.50,
        costPrice: 1.75,
        inStock: 500,
        leadTime: 12
      },
      {
        name: 'Executive Business Card Holder',
        sku: 'CARD-001',
        supplierId: insertedSuppliers[7]?.id || 'default-supplier',
        description: 'Premium metal business card holder with engraving',
        unitPrice: 18.00,
        costPrice: 9.00,
        inStock: 75,
        leadTime: 7
      },
      {
        name: 'Team Jersey',
        sku: 'JERSEY-001',
        supplierId: insertedSuppliers[8]?.id || 'default-supplier',
        description: 'Moisture-wicking sports jersey with custom numbers',
        unitPrice: 32.00,
        costPrice: 16.00,
        inStock: 90,
        leadTime: 8
      }
    ];

    // Insert products
    const insertedProducts = await db.insert(products).values(sampleProducts).onConflictDoNothing().returning();

    // Create sample orders with different statuses and values
    const orderStatuses = ['quote', 'pending_approval', 'approved', 'in_production', 'shipped', 'delivered'] as const;
    const sampleOrders = [];
    
    for (let i = 0; i < 18; i++) {
      const company = insertedCompanies[i % insertedCompanies.length];
      const status = orderStatuses[i % orderStatuses.length];
      const orderValue = 500 + (i * 150) + Math.random() * 1000;
      
      sampleOrders.push({
        orderNumber: `ORD-2025-${String(1001 + i).padStart(4, '0')}`,
        companyId: company?.id || 'default-company',
        status,
        orderType: i % 3 === 0 ? 'rush_order' : 'sales_order' as const,
        subtotal: orderValue.toFixed(2),
        tax: (orderValue * 0.08).toFixed(2),
        shipping: (orderValue * 0.05).toFixed(2),
        total: (orderValue * 1.13).toFixed(2),
        margin: 45.0 + (Math.random() * 10),
        inHandsDate: new Date(Date.now() + (i * 7 + 14) * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() + (i * 7 + 21) * 24 * 60 * 60 * 1000),
        notes: `Order for ${company?.name || 'Company'} - ${status === 'rush_order' ? 'Rush delivery required' : 'Standard processing'}`,
        customerNotes: `Thank you for your business! Expected delivery: ${i + 7}-${i + 14} business days.`,
        trackingNumber: status === 'shipped' || status === 'delivered' ? `1Z999AA1${String(i).padStart(10, '0')}` : null
      });
    }

    // Insert orders
    const insertedOrders = await db.insert(orders).values(sampleOrders).onConflictDoNothing().returning();

    // Create order items for each order
    const sampleOrderItems: any[] = [];
    insertedOrders.forEach((order, orderIndex) => {
      const numItems = 1 + Math.floor(Math.random() * 3); // 1-3 items per order
      for (let i = 0; i < numItems; i++) {
        const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        const quantity = 25 + Math.floor(Math.random() * 475); // 25-500 quantity
        const unitPrice = Number(product?.unitPrice) || 10;
        
        sampleOrderItems.push({
          orderId: order.id,
          productId: product?.id || 'default-product',
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: (quantity * unitPrice).toFixed(2),
          color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Navy'][Math.floor(Math.random() * 6)],
          size: ['S', 'M', 'L', 'XL', 'XXL'][Math.floor(Math.random() * 5)],
          imprintLocation: ['Front', 'Back', 'Left Chest', 'Right Chest'][Math.floor(Math.random() * 4)],
          imprintMethod: ['Screen Print', 'Embroidery', 'Heat Transfer', 'Laser Engraving'][Math.floor(Math.random() * 4)]
        });
      }
    });

    // Insert order items
    await db.insert(orderItems).values(sampleOrderItems).onConflictDoNothing();

    // Get artwork columns
    const columns = await this.getArtworkColumns();
    if (columns.length === 0) {
      // Initialize columns if they don't exist
      await this.initializeArtworkColumns([
        { name: 'PMS Colors', position: 1, color: '#EF4444', isDefault: true },
        { name: 'Artist Schedule', position: 2, color: '#F97316', isDefault: true },
        { name: 'Artwork to Do', position: 3, color: '#EAB308', isDefault: true },
        { name: 'In Progress', position: 4, color: '#3B82F6', isDefault: true },
        { name: 'Questions and clarifications', position: 5, color: '#8B5CF6', isDefault: true },
        { name: 'For Review', position: 6, color: '#EC4899', isDefault: true },
        { name: 'Sent to Client', position: 7, color: '#10B981', isDefault: true },
        { name: 'Completed', position: 8, color: '#22C55E', isDefault: true }
      ]);
    }

    // Refresh columns after initialization
    const artworkColumns = await this.getArtworkColumns();

    // Create sample artwork cards
    const sampleArtworkCards: any[] = [];
    const cardTitles = [
      'TechCorp Logo Design',
      'GreenEarth Tote Bag Artwork',
      'Healthcare Conference Materials',
      'Financial Services Brochure',
      'Creative Studios Brand Package',
      'Robotics Trade Show Banners',
      'Ocean Blue Business Cards',
      'Mountain Adventures T-Shirt Design',
      'Urban Eats Menu Design',
      'Education Program Materials',
      'Solar Systems Infographic',
      'Diamond Jewelry Catalog',
      'Fitness First Merchandise',
      'Pet Paradise Signage',
      'Cloud Nine App Icons',
      'Fresh Garden Labels',
      'Steel Works Safety Posters',
      'Coastal Realty Flyers'
    ];

    const priorities = ['low', 'medium', 'high', 'urgent'] as const;

    cardTitles.forEach((title, index) => {
      const columnIndex = index % artworkColumns.length;
      const column = artworkColumns[columnIndex];
      const company = insertedCompanies[index % insertedCompanies.length];
      const order = insertedOrders[index % insertedOrders.length];
      
      sampleArtworkCards.push({
        title,
        description: `Custom artwork design for ${company?.name || 'client'} - ${title.toLowerCase()}`,
        columnId: column?.id || 'default-column',
        companyId: company?.id || null,
        orderId: order?.id || null,
        position: Math.floor(index / artworkColumns.length) + 1,
        priority: priorities[index % priorities.length],
        dueDate: new Date(Date.now() + (index + 3) * 24 * 60 * 60 * 1000),
        labels: JSON.stringify([
          index % 3 === 0 ? 'urgent' : null,
          index % 4 === 0 ? 'high-value' : null,
          index % 5 === 0 ? 'revision' : null
        ].filter(Boolean)),
        attachments: JSON.stringify([]),
        checklist: JSON.stringify([
          { id: '1', text: 'Initial concept approval', completed: index % 2 === 0 },
          { id: '2', text: 'Design mockup', completed: index % 3 === 0 },
          { id: '3', text: 'Client feedback', completed: index % 4 === 0 },
          { id: '4', text: 'Final artwork', completed: index % 5 === 0 }
        ]),
        comments: JSON.stringify([
          {
            id: '1',
            author: 'Design Team',
            text: 'Initial concepts look great, proceeding with mockup',
            timestamp: new Date().toISOString()
          }
        ])
      });
    });

    // Insert artwork cards
    if (sampleArtworkCards.length > 0) {
      await db.insert(artworkCards).values(sampleArtworkCards).onConflictDoNothing();
    }

    console.log('✓ All dummy data seeded successfully!');
    console.log(`  - ${sampleCompanies.length} companies`);
    console.log(`  - ${sampleSuppliers.length} suppliers`);
    console.log(`  - ${sampleProducts.length} products`);
    console.log(`  - ${sampleOrders.length} orders`);
    console.log(`  - ${sampleOrderItems.length} order items`);
    console.log(`  - ${sampleArtworkCards.length} artwork cards`);
  }

  // AI Presentation Builder operations
  async getPresentations(userId: string): Promise<Presentation[]> {
    return await db.select().from(presentations)
      .where(eq(presentations.userId, userId))
      .orderBy(desc(presentations.createdAt));
  }

  async getPresentation(id: string): Promise<Presentation | undefined> {
    const [presentation] = await db.select().from(presentations)
      .where(eq(presentations.id, id));
    return presentation;
  }

  async createPresentation(presentation: InsertPresentation): Promise<Presentation> {
    const [newPresentation] = await db.insert(presentations)
      .values(presentation)
      .returning();
    return newPresentation;
  }

  async updatePresentation(id: string, presentation: Partial<InsertPresentation>): Promise<Presentation> {
    const [updatedPresentation] = await db.update(presentations)
      .set({ ...presentation, updatedAt: new Date() })
      .where(eq(presentations.id, id))
      .returning();
    return updatedPresentation;
  }

  async deletePresentation(id: string): Promise<void> {
    // Delete associated files first
    await db.delete(presentationFiles).where(eq(presentationFiles.presentationId, id));
    // Delete associated products
    await db.delete(presentationProducts).where(eq(presentationProducts.presentationId, id));
    // Delete presentation
    await db.delete(presentations).where(eq(presentations.id, id));
  }

  async createPresentationFile(file: InsertPresentationFile): Promise<PresentationFile> {
    const [newFile] = await db.insert(presentationFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getPresentationFiles(presentationId: string): Promise<PresentationFile[]> {
    return await db.select().from(presentationFiles)
      .where(eq(presentationFiles.presentationId, presentationId))
      .orderBy(desc(presentationFiles.createdAt));
  }

  async createPresentationProduct(product: InsertPresentationProduct): Promise<PresentationProduct> {
    const [newProduct] = await db.insert(presentationProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async getPresentationProducts(presentationId: string): Promise<PresentationProduct[]> {
    return await db.select().from(presentationProducts)
      .where(eq(presentationProducts.presentationId, presentationId))
      .orderBy(desc(presentationProducts.createdAt));
  }

  // Slack Message operations
  async getSlackMessages(): Promise<SlackMessage[]> {
    return await db.select().from(slackMessages)
      .orderBy(desc(slackMessages.createdAt))
      .limit(100); // Get latest 100 messages
  }

  async createSlackMessage(message: InsertSlackMessage): Promise<SlackMessage> {
    const [newMessage] = await db.insert(slackMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // S&S Activewear operations
  async getSsActivewearProducts(): Promise<SsActivewearProduct[]> {
    return await db.select().from(ssActivewearProducts)
      .where(eq(ssActivewearProducts.isActive, true))
      .orderBy(desc(ssActivewearProducts.updatedAt));
  }

  async getSsActivewearProductBySku(sku: string): Promise<SsActivewearProduct | undefined> {
    const [product] = await db.select().from(ssActivewearProducts)
      .where(eq(ssActivewearProducts.sku, sku));
    return product;
  }

  async createSsActivewearProduct(product: InsertSsActivewearProduct): Promise<SsActivewearProduct> {
    const [newProduct] = await db.insert(ssActivewearProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateSsActivewearProduct(id: string, product: Partial<InsertSsActivewearProduct>): Promise<SsActivewearProduct> {
    const [updatedProduct] = await db.update(ssActivewearProducts)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(ssActivewearProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteSsActivewearProduct(id: string): Promise<void> {
    await db.update(ssActivewearProducts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(ssActivewearProducts.id, id));
  }

  async searchSsActivewearProducts(query: string): Promise<SsActivewearProduct[]> {
    return await db.select().from(ssActivewearProducts)
      .where(
        and(
          eq(ssActivewearProducts.isActive, true),
          or(
            ilike(ssActivewearProducts.sku, `%${query}%`),
            ilike(ssActivewearProducts.brandName, `%${query}%`),
            ilike(ssActivewearProducts.styleName, `%${query}%`),
            ilike(ssActivewearProducts.colorName, `%${query}%`)
          )
        )
      )
      .orderBy(desc(ssActivewearProducts.updatedAt))
      .limit(50);
  }

  // S&S Activewear Import Job operations
  async getSsActivewearImportJobs(userId?: string): Promise<SsActivewearImportJob[]> {
    const query = db.select().from(ssActivewearImportJobs);
    
    if (userId) {
      query.where(eq(ssActivewearImportJobs.userId, userId));
    }
    
    return await query.orderBy(desc(ssActivewearImportJobs.createdAt));
  }

  async getSsActivewearImportJob(id: string): Promise<SsActivewearImportJob | undefined> {
    const [job] = await db.select().from(ssActivewearImportJobs)
      .where(eq(ssActivewearImportJobs.id, id));
    return job;
  }

  async createSsActivewearImportJob(job: InsertSsActivewearImportJob): Promise<SsActivewearImportJob> {
    const [newJob] = await db.insert(ssActivewearImportJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateSsActivewearImportJob(id: string, job: Partial<InsertSsActivewearImportJob>): Promise<SsActivewearImportJob> {
    const [updatedJob] = await db.update(ssActivewearImportJobs)
      .set(job)
      .where(eq(ssActivewearImportJobs.id, id))
      .returning();
    return updatedJob;
  }
}

export const storage = new DatabaseStorage();
