import {
  activities,
  type Activity,
  type ArtworkCard,
  artworkCards,
  type ArtworkColumn,
  artworkColumns,
  type ArtworkFile,
  artworkFiles,
  type Client,
  clients,
  companies,
  type Company,
  type Contact,
  contacts,
  type DataUpload,
  dataUploads,
  type Error,
  errors,
  type InsertActivity,
  type InsertArtworkCard,
  type InsertArtworkColumn,
  type InsertArtworkFile,
  type InsertClient,
  type InsertCompany,
  type InsertContact,
  type InsertDataUpload,
  type InsertError,
  type InsertIntegrationSettings,
  type InsertNewsletterCampaign,
  type InsertNewsletterSubscriber,
  type InsertNewsletterTemplate,
  type InsertOrder,
  type InsertOrderItem,
  type InsertPresentation,
  type InsertPresentationFile,
  type InsertPresentationProduct,
  type InsertProduct,
  type InsertSequence,
  type InsertSequenceAnalytics,
  type InsertSequenceEnrollment,
  type InsertSequenceStep,
  type InsertSlackMessage,
  type InsertSsActivewearImportJob,
  type InsertSsActivewearProduct,
  type InsertSupplier,
  type InsertWeeklyReportConfig,
  type InsertWeeklyReportLog,
  type InsertVendorApprovalRequest,
  integrationSettings,
  type IntegrationSettings,
  type NewsletterCampaign,
  newsletterCampaigns,
  type NewsletterSubscriber,
  newsletterSubscribers,
  type NewsletterTemplate,
  newsletterTemplates,
  type Order,
  type OrderItem,
  orderItems,
  orders,
  type Presentation,
  type PresentationFile,
  presentationFiles,
  type PresentationProduct,
  presentationProducts,
  presentations,
  type Product,
  products,
  type Sequence,
  sequenceAnalytics,
  type SequenceAnalytics,
  type SequenceEnrollment,
  sequenceEnrollments,
  sequences,
  type SequenceStep,
  sequenceSteps,
  type SlackMessage,
  slackMessages,
  type SsActivewearImportJob,
  ssActivewearImportJobs,
  type SsActivewearProduct,
  ssActivewearProducts,
  type SageProduct,
  sageProducts,
  type InsertSageProduct,
  type Supplier,
  suppliers,
  type UpsertUser,
  type User,
  users,
  type UserInvitation,
  userInvitations,
  type InsertUserInvitation,
  type PasswordReset,
  passwordResets,
  type InsertPasswordReset,
  weeklyReportConfig,
  type WeeklyReportConfig,
  type WeeklyReportLog,
  weeklyReportLogs,
  type VendorApprovalRequest,
  vendorApprovalRequests,
  productionStages as productionStagesTable,
  type ProductionStage,
  type InsertProductionStage,
  userEmailSettings,
  type UserEmailSettings,
  type InsertUserEmailSettings,
  vendorInvoices,
  type VendorInvoice,
  type InsertVendorInvoice,
  invoices,
  type Invoice,
  type InsertInvoice,
  paymentTransactions,
  type PaymentTransaction,
  type InsertPaymentTransaction
} from "@shared/schema";
import {
  type Notification,
  type InsertNotification,
  notifications
} from "@shared/project-schema";
import { and, desc, eq, gte, ilike, like, lte, or, sql } from "drizzle-orm";
import { db } from "./db";

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
  getContacts(companyId?: string, supplierId?: string): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;

  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  searchClients(query: string): Promise<Client[]>;

  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierByName(name: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
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
  getProductionOrders(): Promise<any[]>;

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
  updateArtworkCard(id: string, card: Partial<InsertArtworkCard>): Promise<ArtworkCard>;

  // Search functionality
  searchCompanies(query: string): Promise<Company[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Integration Settings operations
  getIntegrationSettings(): Promise<IntegrationSettings | undefined>;
  upsertIntegrationSettings(settings: Partial<InsertIntegrationSettings>, userId?: string): Promise<IntegrationSettings>;
  updateIntegrationSettings(settings: Partial<InsertIntegrationSettings>): Promise<IntegrationSettings>;

  // User Email Settings operations
  getUserEmailSettings(userId: string): Promise<UserEmailSettings | undefined>;
  upsertUserEmailSettings(userId: string, settings: Partial<InsertUserEmailSettings>): Promise<UserEmailSettings>;
  deleteUserEmailSettings(id: string): Promise<void>;

  // SAGE Product operations
  getSageProductBySageId(sageId: string): Promise<SageProduct | undefined>;
  getSageProducts(limit?: number): Promise<SageProduct[]>;
  searchSageProducts(query: string): Promise<SageProduct[]>;
  createSageProduct(product: InsertSageProduct): Promise<string>;
  updateSageProduct(id: string, product: Partial<InsertSageProduct>): Promise<SageProduct>;
  getSupplierBySageId(sageId: string): Promise<Supplier | undefined>;

  // Vendor Invoice operations (Accounts Payable)
  createVendorInvoice(invoice: InsertVendorInvoice): Promise<VendorInvoice>;
  getVendorInvoices(supplierId?: string, status?: string): Promise<VendorInvoice[]>;
  updateVendorInvoice(id: string, invoice: Partial<InsertVendorInvoice>): Promise<VendorInvoice>;
  getVendorInvoice(id: string): Promise<VendorInvoice | undefined>;

  // Customer Invoice operations (Accounts Receivable)
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined>;
  getInvoices(status?: string): Promise<Invoice[]>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;

  // Payment Transaction operations
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransactionsByInvoiceId(invoiceId: string): Promise<PaymentTransaction[]>;

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

  // Weekly Report Config operations
  getWeeklyReportConfigs(): Promise<WeeklyReportConfig[]>;
  createWeeklyReportConfig(config: InsertWeeklyReportConfig): Promise<WeeklyReportConfig>;
  updateWeeklyReportConfig(id: string, config: Partial<InsertWeeklyReportConfig>): Promise<WeeklyReportConfig>;
  deleteWeeklyReportConfig(id: string): Promise<void>;

  // Weekly Report Log operations  
  getWeeklyReportLogs(userId?: string): Promise<WeeklyReportLog[]>;
  createWeeklyReportLog(log: InsertWeeklyReportLog): Promise<WeeklyReportLog>;
  updateWeeklyReportLog(id: string, log: Partial<InsertWeeklyReportLog>): Promise<WeeklyReportLog>;

  // Sequence operations
  getSequences(userId?: string): Promise<Sequence[]>;
  getSequence(id: string): Promise<Sequence | undefined>;
  createSequence(sequence: InsertSequence): Promise<Sequence>;
  updateSequence(id: string, sequence: Partial<InsertSequence>): Promise<Sequence>;
  deleteSequence(id: string): Promise<void>;

  // Sequence Step operations
  getSequenceSteps(sequenceId: string): Promise<SequenceStep[]>;
  createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep>;
  updateSequenceStep(id: string, step: Partial<InsertSequenceStep>): Promise<SequenceStep>;
  deleteSequenceStep(id: string): Promise<void>;

  // Sequence Enrollment operations
  getSequenceEnrollments(sequenceId?: string): Promise<SequenceEnrollment[]>;
  createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment>;
  updateSequenceEnrollment(id: string, enrollment: Partial<InsertSequenceEnrollment>): Promise<SequenceEnrollment>;

  // Sequence Analytics operations
  getSequenceAnalytics(sequenceId: string): Promise<SequenceAnalytics[]>;
  createSequenceAnalytics(analytics: InsertSequenceAnalytics): Promise<SequenceAnalytics>;

  // Error tracking operations
  getErrors(): Promise<Error[]>;
  getError(id: string): Promise<Error | undefined>;
  createError(error: InsertError): Promise<Error>;
  updateError(id: string, error: Partial<InsertError>): Promise<Error>;
  deleteError(id: string): Promise<void>;
  getErrorsByOrder(orderId: string): Promise<Error[]>;
  getErrorsByType(errorType: string): Promise<Error[]>;
  getErrorsByDateRange(startDate: Date, endDate: Date): Promise<Error[]>;
  resolveError(id: string, resolvedBy: string): Promise<Error>;
  getErrorStatistics(): Promise<{
    totalErrors: number;
    resolvedErrors: number;
    unresolvedErrors: number;
    costToLsd: number;
    errorsByType: { [key: string]: number };
    errorsByResponsibleParty: { [key: string]: number };
  }>;

  // Newsletter operations
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterCampaigns(): Promise<NewsletterCampaign[]>;
  createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign>;
  getNewsletterTemplates(): Promise<NewsletterTemplate[]>;
  createNewsletterTemplate(template: InsertNewsletterTemplate): Promise<NewsletterTemplate>;

  // Production stages operations
  getProductionStages(): Promise<ProductionStage[]>;
  getProductionStage(id: string): Promise<ProductionStage | undefined>;
  createProductionStage(stage: InsertProductionStage): Promise<ProductionStage>;
  updateProductionStage(id: string, stage: Partial<InsertProductionStage>): Promise<ProductionStage>;
  deleteProductionStage(id: string): Promise<void>;
  reorderProductionStages(stageIds: string[]): Promise<ProductionStage[]>;
  seedDefaultProductionStages(): Promise<void>;
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
      .values({
        ...userData,
        updatedAt: new Date(), // Set updatedAt as lastActive
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          // Only update role if explicitly provided (for first-time setup)
          ...(userData.role && { role: userData.role }),
          updatedAt: new Date(), // Update on every login
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
    // Cascade delete: First delete all related records
    const { contacts, orders, orderItems } = await import("@shared/schema");

    // Delete order items for orders belonging to this company
    const companyOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.companyId, id));

    const orderIds = companyOrders.map(o => o.id);
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(
        sql`${orderItems.orderId} IN ${sql.raw(`(${orderIds.map(id => `'${id}'`).join(',')})`)}`
      );
    }

    // Delete orders
    await db.delete(orders).where(eq(orders.companyId, id));

    // Delete contacts
    await db.delete(contacts).where(eq(contacts.companyId, id));

    // Finally delete the company
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
  async getContacts(companyId?: string, supplierId?: string): Promise<Contact[]> {
    const query = db.select({
      id: contacts.id,
      companyId: contacts.companyId,
      supplierId: contacts.supplierId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      title: contacts.title,
      isPrimary: contacts.isPrimary,
      billingAddress: contacts.billingAddress,
      shippingAddress: contacts.shippingAddress,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
    }).from(contacts);
    if (companyId) {
      return await query.where(eq(contacts.companyId, companyId));
    }
    if (supplierId) {
      return await query.where(eq(contacts.supplierId, supplierId)).orderBy(desc(contacts.createdAt));
    }
    return await query.orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    // If creating this contact as primary, unset other primary contacts for the same company or supplier
    if (contact.isPrimary === true) {
      if (contact.companyId) {
        await db
          .update(contacts)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(contacts.companyId, contact.companyId));
      }
      if (contact.supplierId) {
        await db
          .update(contacts)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(contacts.supplierId, contact.supplierId));
      }
    }

    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    try {
      console.log('Storage: Updating contact', id, 'with data:', contact);

      // If setting this contact as primary, unset other primary contacts for the same company or supplier
      if (contact.isPrimary === true) {
        const [currentContact] = await db.select().from(contacts).where(eq(contacts.id, id));
        console.log('Current contact:', currentContact);

        if (currentContact) {
          if (currentContact.companyId) {
            // Unset all other primary contacts for this company
            console.log('Unsetting other primary contacts for company:', currentContact.companyId);
            await db
              .update(contacts)
              .set({ isPrimary: false, updatedAt: new Date() })
              .where(
                and(
                  eq(contacts.companyId, currentContact.companyId),
                  sql`${contacts.id} != ${id}`
                )
              );
          }
          if (currentContact.supplierId) {
            // Unset all other primary contacts for this supplier
            console.log('Unsetting other primary contacts for supplier:', currentContact.supplierId);
            await db
              .update(contacts)
              .set({ isPrimary: false, updatedAt: new Date() })
              .where(
                and(
                  eq(contacts.supplierId, currentContact.supplierId),
                  sql`${contacts.id} != ${id}`
                )
              );
          }
        }
      }

      const [updatedContact] = await db
        .update(contacts)
        .set({ ...contact, updatedAt: new Date() })
        .where(eq(contacts.id, id))
        .returning();

      console.log('Updated contact:', updatedContact);

      if (!updatedContact) {
        throw new Error('Contact not found or update failed');
      }

      return updatedContact;
    } catch (error) {
      console.error('Error in updateContact:', error);
      throw error;
    }
  }

  async deleteContact(id: string): Promise<void> {
    // Cascade delete: First delete all related records
    const { orders, orderItems } = await import("@shared/schema");

    // Get all orders for this contact
    const contactOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.contactId, id));

    const orderIds = contactOrders.map(o => o.id);
    if (orderIds.length > 0) {
      // Delete order items first
      await db.delete(orderItems).where(
        sql`${orderItems.orderId} IN ${sql.raw(`(${orderIds.map(id => `'${id}'`).join(',')})`)}`
      );
    }

    // Delete orders
    await db.delete(orders).where(eq(orders.contactId, id));

    // Finally delete the contact
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(clientData).returning();
    return newClient;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();

    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        or(
          ilike(clients.firstName, `%${query}%`),
          ilike(clients.lastName, `%${query}%`),
          ilike(clients.email, `%${query}%`),
          ilike(clients.company, `%${query}%`)
        )
      )
      .orderBy(desc(clients.createdAt));
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, name));
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



  // Vendor Invoice operations
  async createVendorInvoice(invoice: InsertVendorInvoice): Promise<VendorInvoice> {
    const [newInvoice] = await db.insert(vendorInvoices).values(invoice).returning();
    return newInvoice;
  }

  async getVendorInvoices(supplierId?: string, status?: string): Promise<VendorInvoice[]> {
    const query = db.select().from(vendorInvoices);

    if (supplierId && status) {
      return await query.where(and(eq(vendorInvoices.supplierId, supplierId), eq(vendorInvoices.status, status))).orderBy(desc(vendorInvoices.createdAt));
    } else if (supplierId) {
      return await query.where(eq(vendorInvoices.supplierId, supplierId)).orderBy(desc(vendorInvoices.createdAt));
    } else if (status) {
      return await query.where(eq(vendorInvoices.status, status)).orderBy(desc(vendorInvoices.createdAt));
    }

    return await query.orderBy(desc(vendorInvoices.createdAt));
  }

  async updateVendorInvoice(id: string, invoice: Partial<InsertVendorInvoice>): Promise<VendorInvoice> {
    const [updatedInvoice] = await db
      .update(vendorInvoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(vendorInvoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getVendorInvoice(id: string): Promise<VendorInvoice | undefined> {
    const [invoice] = await db.select().from(vendorInvoices).where(eq(vendorInvoices.id, id));
    return invoice;
  }

  // Customer Invoice operations (Accounts Receivable)
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    return invoice;
  }

  async getInvoices(status?: string): Promise<Invoice[]> {
    if (status) {
      return await db.select().from(invoices).where(eq(invoices.status, status));
    }
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updated] = await db.update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // Payment Transaction operations
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [newTransaction] = await db.insert(paymentTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getPaymentTransactionsByInvoiceId(invoiceId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.invoiceId, invoiceId))
      .orderBy(desc(paymentTransactions.createdAt));
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

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
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
      const currentYear = new Date().getFullYear();
      const prefix = `ORD-${currentYear}-`;

      // Get the highest order number for current year
      const lastOrder = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(sql`${orders.orderNumber} LIKE ${prefix + '%'}`)
        .orderBy(desc(orders.orderNumber))
        .limit(1);

      let nextNumber = 1;
      if (lastOrder.length > 0 && lastOrder[0].orderNumber) {
        // Extract number from last order (e.g., "ORD-2026-030" -> 30)
        const lastNumber = parseInt(lastOrder[0].orderNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      orderNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
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
        notes: orderItems.notes,
        createdAt: orderItems.createdAt,
        // Join product info
        productName: products.name,
        productSku: products.sku,
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

  async updateArtworkCard(id: string, card: Partial<InsertArtworkCard>): Promise<ArtworkCard> {
    const [updatedCard] = await db
      .update(artworkCards)
      .set({ ...card, updatedAt: new Date() })
      .where(eq(artworkCards.id, id))
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
      const orderType = i % 3 === 0 ? 'rush_order' : 'sales_order' as const;

      sampleOrders.push({
        orderNumber: `ORD-2025-${String(1001 + i).padStart(4, '0')}`,
        companyId: company?.id || 'default-company',
        status,
        orderType,
        subtotal: orderValue.toFixed(2),
        tax: (orderValue * 0.08).toFixed(2),
        shipping: (orderValue * 0.05).toFixed(2),
        total: (orderValue * 1.13).toFixed(2),
        margin: (45.0 + (Math.random() * 10)).toFixed(2),
        inHandsDate: new Date(Date.now() + (i * 7 + 14) * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() + (i * 7 + 21) * 24 * 60 * 60 * 1000),
        notes: `Order for ${company?.name || 'Company'} - ${orderType === 'rush_order' ? 'Rush delivery required' : 'Standard processing'}`,
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
        const unitPrice = 10 + Math.random() * 40; // Random price between 10-50 

        sampleOrderItems.push({
          orderId: order.id,
          productId: product?.id || 'default-product',
          supplierId: product?.supplierId || insertedSuppliers[0]?.id, // Assign supplier from product
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

    // Insert order items only if we have items to insert
    if (sampleOrderItems.length > 0) {
      await db.insert(orderItems).values(sampleOrderItems).onConflictDoNothing();
    }

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
      .orderBy(desc(presentationFiles.uploadedAt));
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

  // Weekly Report Config operations
  async getWeeklyReportConfigs(): Promise<WeeklyReportConfig[]> {
    return await db.select().from(weeklyReportConfig).orderBy(weeklyReportConfig.sortOrder);
  }

  async createWeeklyReportConfig(config: InsertWeeklyReportConfig): Promise<WeeklyReportConfig> {
    const [created] = await db.insert(weeklyReportConfig).values(config).returning();
    return created;
  }

  async updateWeeklyReportConfig(id: string, config: Partial<InsertWeeklyReportConfig>): Promise<WeeklyReportConfig> {
    const [updated] = await db
      .update(weeklyReportConfig)
      .set(config)
      .where(eq(weeklyReportConfig.id, id))
      .returning();
    return updated;
  }

  async deleteWeeklyReportConfig(id: string): Promise<void> {
    await db.delete(weeklyReportConfig).where(eq(weeklyReportConfig.id, id));
  }

  // Weekly Report Log operations
  async getWeeklyReportLogs(userId?: string): Promise<WeeklyReportLog[]> {
    const query = db.select().from(weeklyReportLogs);
    if (userId) {
      return await query.where(eq(weeklyReportLogs.userId, userId)).orderBy(desc(weeklyReportLogs.createdAt));
    }
    return await query.orderBy(desc(weeklyReportLogs.createdAt));
  }

  async createWeeklyReportLog(log: InsertWeeklyReportLog): Promise<WeeklyReportLog> {
    const [created] = await db.insert(weeklyReportLogs).values(log).returning();
    return created;
  }

  async updateWeeklyReportLog(id: string, log: Partial<InsertWeeklyReportLog>): Promise<WeeklyReportLog> {
    const [updated] = await db
      .update(weeklyReportLogs)
      .set(log)
      .where(eq(weeklyReportLogs.id, id))
      .returning();
    return updated;
  }

  // Sequence operations
  async getSequences(userId?: string): Promise<Sequence[]> {
    const query = db.select().from(sequences);
    if (userId) {
      query.where(eq(sequences.userId, userId));
    }
    return await query.orderBy(desc(sequences.createdAt));
  }

  async getSequence(id: string): Promise<Sequence | undefined> {
    const [sequence] = await db.select().from(sequences).where(eq(sequences.id, id));
    return sequence;
  }

  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const [newSequence] = await db.insert(sequences)
      .values(sequence)
      .returning();
    return newSequence;
  }

  async updateSequence(id: string, sequence: Partial<InsertSequence>): Promise<Sequence> {
    const [updatedSequence] = await db.update(sequences)
      .set({ ...sequence, updatedAt: new Date() })
      .where(eq(sequences.id, id))
      .returning();
    return updatedSequence;
  }

  async deleteSequence(id: string): Promise<void> {
    await db.delete(sequences).where(eq(sequences.id, id));
  }

  // Sequence Step operations
  async getSequenceSteps(sequenceId: string): Promise<SequenceStep[]> {
    return await db.select().from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId))
      .orderBy(sequenceSteps.position);
  }

  async createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep> {
    const [newStep] = await db.insert(sequenceSteps)
      .values(step)
      .returning();
    return newStep;
  }

  async updateSequenceStep(id: string, step: Partial<InsertSequenceStep>): Promise<SequenceStep> {
    const [updatedStep] = await db.update(sequenceSteps)
      .set({ ...step, updatedAt: new Date() })
      .where(eq(sequenceSteps.id, id))
      .returning();
    return updatedStep;
  }

  async deleteSequenceStep(id: string): Promise<void> {
    await db.delete(sequenceSteps).where(eq(sequenceSteps.id, id));
  }

  // Sequence Enrollment operations
  async getSequenceEnrollments(sequenceId?: string): Promise<SequenceEnrollment[]> {
    const query = db.select().from(sequenceEnrollments);
    if (sequenceId) {
      query.where(eq(sequenceEnrollments.sequenceId, sequenceId));
    }
    return await query.orderBy(desc(sequenceEnrollments.enrolledAt));
  }

  async createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment> {
    const [newEnrollment] = await db.insert(sequenceEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async updateSequenceEnrollment(id: string, enrollment: Partial<InsertSequenceEnrollment>): Promise<SequenceEnrollment> {
    const [updatedEnrollment] = await db.update(sequenceEnrollments)
      .set(enrollment)
      .where(eq(sequenceEnrollments.id, id))
      .returning();
    return updatedEnrollment;
  }

  // Sequence Analytics operations
  async getSequenceAnalytics(sequenceId: string): Promise<SequenceAnalytics[]> {
    return await db.select().from(sequenceAnalytics)
      .where(eq(sequenceAnalytics.sequenceId, sequenceId))
      .orderBy(desc(sequenceAnalytics.date));
  }

  async createSequenceAnalytics(analytics: InsertSequenceAnalytics): Promise<SequenceAnalytics> {
    const [newAnalytics] = await db.insert(sequenceAnalytics)
      .values(analytics)
      .returning();
    return newAnalytics;
  }

  // Error tracking operations
  async getErrors(): Promise<Error[]> {
    return await db.select().from(errors).orderBy(desc(errors.date));
  }

  async getError(id: string): Promise<Error | undefined> {
    const [error] = await db.select().from(errors).where(eq(errors.id, id));
    return error;
  }

  async createError(error: InsertError): Promise<Error> {
    const [newError] = await db.insert(errors)
      .values({
        ...error,
        date: error.date || new Date(),
      })
      .returning();
    return newError;
  }

  async updateError(id: string, error: Partial<InsertError>): Promise<Error> {
    const [updatedError] = await db.update(errors)
      .set({ ...error, updatedAt: new Date() })
      .where(eq(errors.id, id))
      .returning();
    return updatedError;
  }

  async deleteError(id: string): Promise<void> {
    await db.delete(errors).where(eq(errors.id, id));
  }

  async getErrorsByOrder(orderId: string): Promise<Error[]> {
    return await db.select().from(errors)
      .where(eq(errors.orderId, orderId))
      .orderBy(desc(errors.date));
  }

  async getErrorsByType(errorType: string): Promise<Error[]> {
    return await db.select().from(errors)
      .where(eq(errors.errorType, errorType as any))
      .orderBy(desc(errors.date));
  }

  async getErrorsByDateRange(startDate: Date, endDate: Date): Promise<Error[]> {
    return await db.select().from(errors)
      .where(and(
        gte(errors.date, startDate),
        lte(errors.date, endDate)
      ))
      .orderBy(desc(errors.date));
  }

  async resolveError(id: string, resolvedBy: string): Promise<Error> {
    const [resolvedError] = await db.update(errors)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy,
        updatedAt: new Date(),
      })
      .where(eq(errors.id, id))
      .returning();
    return resolvedError;
  }

  async getErrorStatistics(): Promise<{
    totalErrors: number;
    resolvedErrors: number;
    unresolvedErrors: number;
    costToLsd: number;
    errorsByType: { [key: string]: number };
    errorsByResponsibleParty: { [key: string]: number };
  }> {
    const allErrors = await this.getErrors();

    const totalErrors = allErrors.length;
    const resolvedErrors = allErrors.filter(e => e.isResolved).length;
    const unresolvedErrors = totalErrors - resolvedErrors;
    const costToLsd = allErrors.reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0);

    const errorsByType: { [key: string]: number } = {};
    const errorsByResponsibleParty: { [key: string]: number } = {};

    allErrors.forEach(error => {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
      errorsByResponsibleParty[error.responsibleParty] = (errorsByResponsibleParty[error.responsibleParty] || 0) + 1;
    });

    return {
      totalErrors,
      resolvedErrors,
      unresolvedErrors,
      costToLsd,
      errorsByType,
      errorsByResponsibleParty,
    };
  }
  // Newsletter operations 
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  }

  async createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [newSubscriber] = await db.insert(newsletterSubscribers).values(subscriber as any).returning();
    return newSubscriber;
  }

  async getNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
    return await db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt));
  }

  async createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign> {
    const [newCampaign] = await db.insert(newsletterCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async getNewsletterTemplates(): Promise<NewsletterTemplate[]> {
    return await db.select().from(newsletterTemplates).orderBy(desc(newsletterTemplates.createdAt));
  }

  async createNewsletterTemplate(template: InsertNewsletterTemplate): Promise<NewsletterTemplate> {
    const [newTemplate] = await db.insert(newsletterTemplates).values(template).returning();
    return newTemplate;
  }

  // Integration Settings operations
  async getIntegrationSettings(): Promise<IntegrationSettings | undefined> {
    const [settings] = await db.select().from(integrationSettings).limit(1);
    return settings;
  }

  async upsertIntegrationSettings(settings: Partial<InsertIntegrationSettings>, userId?: string): Promise<IntegrationSettings> {
    const existing = await this.getIntegrationSettings();

    const settingsData = {
      ...settings,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(integrationSettings)
        .set(settingsData)
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(integrationSettings)
        .values(settingsData as any)
        .returning();
      return created;
    }
  }

  async updateIntegrationSettings(settings: Partial<InsertIntegrationSettings>): Promise<IntegrationSettings> {
    const existing = await this.getIntegrationSettings();

    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(integrationSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(integrationSettings)
        .values({
          ...settings,
          updatedAt: new Date(),
        } as any)
        .returning();
      return created;
    }
  }

  // User Email Settings operations
  async getUserEmailSettings(userId: string): Promise<UserEmailSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userEmailSettings)
      .where(eq(userEmailSettings.userId, userId))
      .limit(1);
    return settings;
  }

  async upsertUserEmailSettings(userId: string, settings: Partial<InsertUserEmailSettings>): Promise<UserEmailSettings> {
    const existing = await this.getUserEmailSettings(userId);

    const settingsData = {
      ...settings,
      userId,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await db
        .update(userEmailSettings)
        .set(settingsData)
        .where(eq(userEmailSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userEmailSettings)
        .values(settingsData as any)
        .returning();
      return created;
    }
  }

  async deleteUserEmailSettings(id: string): Promise<void> {
    await db.delete(userEmailSettings).where(eq(userEmailSettings.id, id));
  }

  // SAGE Product operations
  async getSageProductBySageId(sageId: string): Promise<SageProduct | undefined> {
    const [product] = await db
      .select()
      .from(sageProducts)
      .where(eq(sageProducts.sageId, sageId))
      .limit(1);
    return product;
  }

  async getSageProducts(limit: number = 100): Promise<SageProduct[]> {
    return db
      .select()
      .from(sageProducts)
      .where(eq(sageProducts.syncStatus, 'active'))
      .limit(limit)
      .orderBy(desc(sageProducts.lastSyncedAt));
  }

  async searchSageProducts(query: string): Promise<SageProduct[]> {
    return db
      .select()
      .from(sageProducts)
      .where(
        or(
          ilike(sageProducts.productName, `%${query}%`),
          ilike(sageProducts.productNumber, `%${query}%`),
          ilike(sageProducts.brand, `%${query}%`),
          ilike(sageProducts.category, `%${query}%`)
        )
      )
      .limit(50)
      .orderBy(desc(sageProducts.lastSyncedAt));
  }

  async createSageProduct(product: InsertSageProduct): Promise<string> {
    const [newProduct] = await db
      .insert(sageProducts)
      .values(product as any)
      .returning({ id: sageProducts.id });
    return newProduct.id;
  }

  async updateSageProduct(id: string, product: Partial<InsertSageProduct>): Promise<SageProduct> {
    const [updated] = await db
      .update(sageProducts)
      .set({ ...product, lastSyncedAt: new Date() })
      .where(eq(sageProducts.id, id))
      .returning();
    return updated;
  }

  // User Invitation operations
  async createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [newInvitation] = await db
      .insert(userInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getUserInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));
    return invitation;
  }

  async getUserInvitationByEmail(email: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.email, email),
          sql`${userInvitations.acceptedAt} IS NULL`,
          sql`${userInvitations.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(userInvitations.createdAt))
      .limit(1);
    return invitation;
  }

  async getPendingInvitations(): Promise<UserInvitation[]> {
    return await db
      .select()
      .from(userInvitations)
      .where(
        and(
          sql`${userInvitations.acceptedAt} IS NULL`,
          sql`${userInvitations.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(userInvitations.createdAt));
  }

  async markInvitationAccepted(token: string): Promise<void> {
    await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.token, token));
  }

  async deleteInvitation(id: string): Promise<void> {
    await db.delete(userInvitations).where(eq(userInvitations.id, id));
  }

  // Password Reset operations
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    const [newReset] = await db
      .insert(passwordResets)
      .values(reset)
      .returning();
    return newReset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          sql`${passwordResets.usedAt} IS NULL`,
          sql`${passwordResets.expiresAt} > NOW()`
        )
      );
    return reset;
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.token, token));
  }

  // User operations - update for username/password
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getSupplierBySageId(sageId: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.sageId, sageId))
      .limit(1);
    return supplier;
  }

  // Vendor Approval Request operations
  async getVendorApprovalRequests(status?: string): Promise<VendorApprovalRequest[]> {
    if (status) {
      return await db
        .select()
        .from(vendorApprovalRequests)
        .where(eq(vendorApprovalRequests.status, status))
        .orderBy(desc(vendorApprovalRequests.createdAt));
    }
    return await db
      .select()
      .from(vendorApprovalRequests)
      .orderBy(desc(vendorApprovalRequests.createdAt));
  }

  async getVendorApprovalRequest(id: string): Promise<VendorApprovalRequest | undefined> {
    const [request] = await db
      .select()
      .from(vendorApprovalRequests)
      .where(eq(vendorApprovalRequests.id, id))
      .limit(1);
    return request;
  }

  async createVendorApprovalRequest(request: InsertVendorApprovalRequest): Promise<VendorApprovalRequest> {
    const [newRequest] = await db
      .insert(vendorApprovalRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateVendorApprovalRequest(id: string, data: Partial<VendorApprovalRequest>): Promise<VendorApprovalRequest> {
    const [updated] = await db
      .update(vendorApprovalRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vendorApprovalRequests.id, id))
      .returning();
    return updated;
  }

  async getPendingApprovalsBySupplier(supplierId: string): Promise<VendorApprovalRequest[]> {
    return await db
      .select()
      .from(vendorApprovalRequests)
      .where(
        and(
          eq(vendorApprovalRequests.supplierId, supplierId),
          eq(vendorApprovalRequests.status, 'pending')
        )
      )
      .orderBy(desc(vendorApprovalRequests.createdAt));
  }

  async getApprovedRequestForOrder(supplierId: string, orderId: string, userId: string): Promise<VendorApprovalRequest | null> {
    const results = await db
      .select()
      .from(vendorApprovalRequests)
      .where(
        and(
          eq(vendorApprovalRequests.supplierId, supplierId),
          eq(vendorApprovalRequests.orderId, orderId),
          eq(vendorApprovalRequests.requestedBy, userId),
          eq(vendorApprovalRequests.status, 'approved')
        )
      )
      .limit(1);
    return results[0] || null;
  }

  // Notification operations
  async getNotificationsForUser(userId: string, limit?: number): Promise<Notification[]> {
    const query = db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false)
        )
      );
    return Number(result[0]?.count || 0);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Helper to create notifications for multiple users
  async createNotificationsForUsers(
    userIds: string[],
    notificationData: Omit<InsertNotification, 'recipientId'>
  ): Promise<Notification[]> {
    const notificationsToCreate = userIds.map(userId => ({
      ...notificationData,
      recipientId: userId,
    }));

    const created = await db
      .insert(notifications)
      .values(notificationsToCreate)
      .returning();
    return created;
  }

  // Production stages operations
  async getProductionStages(): Promise<ProductionStage[]> {
    return await db.select().from(productionStagesTable).where(eq(productionStagesTable.isActive, true)).orderBy(productionStagesTable.order);
  }

  async getProductionStage(id: string): Promise<ProductionStage | undefined> {
    const [stage] = await db.select().from(productionStagesTable).where(eq(productionStagesTable.id, id));
    return stage;
  }

  async createProductionStage(stage: InsertProductionStage): Promise<ProductionStage> {
    const [created] = await db.insert(productionStagesTable).values(stage).returning();
    return created;
  }

  async updateProductionStage(id: string, stage: Partial<InsertProductionStage>): Promise<ProductionStage> {
    const [updated] = await db
      .update(productionStagesTable)
      .set({ ...stage, updatedAt: new Date() })
      .where(eq(productionStagesTable.id, id))
      .returning();
    return updated;
  }

  async deleteProductionStage(id: string): Promise<void> {
    await db.update(productionStagesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(productionStagesTable.id, id));
  }

  async reorderProductionStages(stageIds: string[]): Promise<ProductionStage[]> {
    for (let i = 0; i < stageIds.length; i++) {
      await db
        .update(productionStagesTable)
        .set({ order: i + 1, updatedAt: new Date() })
        .where(eq(productionStagesTable.id, stageIds[i]));
    }
    return this.getProductionStages();
  }

  async seedDefaultProductionStages(): Promise<void> {
    const existing = await db.select().from(productionStagesTable).limit(1);
    if (existing.length > 0) return; // Already seeded

    const defaults: InsertProductionStage[] = [
      { id: 'sales-booked', name: 'Sales Order Booked', order: 1, color: 'bg-blue-100 text-blue-800', icon: 'ShoppingCart', description: 'Initial order received from sales' },
      { id: 'po-placed', name: 'Purchase Order Placed', order: 2, color: 'bg-purple-100 text-purple-800', icon: 'FileText', description: 'PO sent to vendor' },
      { id: 'confirmation-received', name: 'Confirmation Received', order: 3, color: 'bg-indigo-100 text-indigo-800', icon: 'MessageSquare', description: 'Vendor confirmed order' },
      { id: 'proof-received', name: 'Proof Received', order: 4, color: 'bg-yellow-100 text-yellow-800', icon: 'Eye', description: 'Artwork proof from vendor' },
      { id: 'proof-approved', name: 'Proof Approved', order: 5, color: 'bg-orange-100 text-orange-800', icon: 'ThumbsUp', description: 'Client approved artwork' },
      { id: 'invoice-paid', name: 'Invoice Paid', order: 6, color: 'bg-green-100 text-green-800', icon: 'CreditCard', description: 'Payment received' },
      { id: 'shipping-scheduled', name: 'Shipping Scheduled', order: 7, color: 'bg-cyan-100 text-cyan-800', icon: 'Truck', description: 'Shipment scheduled' },
      { id: 'shipped', name: 'Shipped', order: 8, color: 'bg-emerald-100 text-emerald-800', icon: 'MapPin', description: 'Order shipped to customer' },
    ];

    await db.insert(productionStagesTable).values(defaults);
  }
}

export const storage = new DatabaseStorage();
