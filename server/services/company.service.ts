import type { InsertCompany } from "@shared/schema";
import { companyRepository } from "../repositories/company.repository";
import { companyAddressRepository } from "../repositories/company-address.repository";
import { activityRepository } from "../repositories/activity.repository";

export class CompanyService {
  async getAllWithYtd() {
    const { db } = await import("../db");
    const { orders, companies } = await import("@shared/schema");
    const { gte, sql } = await import("drizzle-orm");

    const allCompanies = await companyRepository.getAll();

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Single aggregation query instead of N+1
    const ytdResults = await db
      .select({
        companyId: orders.companyId,
        total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, yearStart))
      .groupBy(orders.companyId);

    const ytdMap = new Map(ytdResults.map(r => [r.companyId, parseFloat(r.total || '0')]));

    // Batch update companies whose YTD changed
    const updates: Promise<void>[] = [];
    const result = allCompanies.map((company) => {
      const ytdSpend = ytdMap.get(company.id) || 0;
      if (ytdSpend !== parseFloat(company.ytdSpend || '0')) {
        updates.push(companyRepository.updateYtdSpend(company.id, ytdSpend.toFixed(2)));
      }
      return { ...company, ytdSpend: ytdSpend.toFixed(2) };
    });

    await Promise.all(updates);
    return result;
  }

  async search(query: string) {
    return companyRepository.search(query);
  }

  async getById(id: string) {
    const company = await companyRepository.getById(id);
    if (!company) return undefined;
    const addresses = await companyAddressRepository.getByCompanyId(id);

    // Fetch assigned user info if set
    let assignedUser = null;
    if (company.assignedUserId) {
      const { db } = await import("../db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, company.assignedUserId));
      assignedUser = user || null;
    }

    return { ...company, addresses, assignedUser };
  }

  /**
   * Builds social media links object from individual URL fields.
   */
  private buildSocialMediaLinks(body: any) {
    const { linkedinUrl, twitterUrl, facebookUrl, instagramUrl, otherSocialUrl, ...rest } = body;

    const socialMediaLinks = {
      linkedin: linkedinUrl || undefined,
      twitter: twitterUrl || undefined,
      facebook: facebookUrl || undefined,
      instagram: instagramUrl || undefined,
      other: otherSocialUrl || undefined,
    };

    return {
      data: {
        ...rest,
        ...(Object.values(socialMediaLinks).some(link => link) && { socialMediaLinks })
      }
    };
  }

  async create(body: InsertCompany, userId: string) {
    const { data } = this.buildSocialMediaLinks(body);
    const company = await companyRepository.create(data);

    await activityRepository.createActivity({
      userId,
      entityType: 'company',
      entityId: company.id,
      action: 'created',
      description: `Created company: ${company.name}`,
    });

    return company;
  }

  async update(id: string, body: Partial<InsertCompany>, userId: string) {
    const { data } = this.buildSocialMediaLinks(body);
    const company = await companyRepository.update(id, data);

    await activityRepository.createActivity({
      userId,
      entityType: 'company',
      entityId: company.id,
      action: 'updated',
      description: `Updated company: ${company.name}`,
    });

    return company;
  }

  async delete(id: string, userId: string) {
    await companyRepository.delete(id);

    await activityRepository.createActivity({
      userId,
      entityType: 'company',
      entityId: id,
      action: 'deleted',
      description: `Deleted company`,
    });
  }

  async getActivities(companyId: string) {
    const { db } = await import("../db");
    const { orders, users, projectActivities, activities } = await import("@shared/schema");
    const { eq, desc, inArray, sql } = await import("drizzle-orm");

    // 1. Get company-level activities (CRUD events)
    const { and } = await import("drizzle-orm");
    const companyActivities = await db
      .select({
        id: activities.id,
        activityType: activities.action,
        content: activities.description,
        metadata: activities.metadata,
        userId: activities.userId,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(
        and(eq(activities.entityType, "company"), eq(activities.entityId, companyId))
      )
      .orderBy(desc(activities.createdAt));

    // 2. Get all order IDs for this company
    const companyOrders = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, projectName: orders.projectName })
      .from(orders)
      .where(eq(orders.companyId, companyId));

    if (companyOrders.length === 0) {
      return companyActivities.map((a: any) => ({
        id: a.id,
        type: "company",
        activityType: a.activityType,
        content: a.content,
        metadata: a.metadata,
        userId: a.userId,
        orderId: null,
        orderNumber: null,
        projectName: null,
        isSystemGenerated: true,
        createdAt: a.createdAt,
        userName: null,
      }));
    }

    const orderIds = companyOrders.map(o => o.id);
    const orderMap = new Map(companyOrders.map(o => [o.id, o]));

    // 3. Get project activities for all company orders
    const projActivities = await db
      .select({
        id: projectActivities.id,
        activityType: projectActivities.activityType,
        content: projectActivities.content,
        metadata: projectActivities.metadata,
        userId: projectActivities.userId,
        orderId: projectActivities.orderId,
        isSystemGenerated: projectActivities.isSystemGenerated,
        createdAt: projectActivities.createdAt,
        userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, '')`,
      })
      .from(projectActivities)
      .leftJoin(users, eq(projectActivities.userId, users.id))
      .where(inArray(projectActivities.orderId, orderIds))
      .orderBy(desc(projectActivities.createdAt))
      .limit(200);

    // 4. Merge and sort all activities
    const merged: any[] = [
      ...companyActivities.map((a: any) => ({
        id: a.id,
        type: "company",
        activityType: a.activityType,
        content: a.content,
        metadata: a.metadata,
        userId: a.userId,
        orderId: null,
        orderNumber: null,
        projectName: null,
        isSystemGenerated: true,
        createdAt: a.createdAt,
        userName: null,
      })),
      ...projActivities.map((a: any) => {
        const order = orderMap.get(a.orderId);
        return {
          id: a.id,
          type: "project",
          activityType: a.activityType,
          content: a.content,
          metadata: a.metadata,
          userId: a.userId,
          orderId: a.orderId,
          orderNumber: order?.orderNumber || null,
          projectName: order?.projectName || null,
          isSystemGenerated: a.isSystemGenerated,
          createdAt: a.createdAt,
          userName: a.userName,
        };
      }),
    ];

    // Sort by createdAt descending
    merged.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return merged.slice(0, 200);
  }

  async getProjects(companyId: string) {
    const { db } = await import("../db");
    const { orders, companies } = await import("@shared/schema");
    const { eq, desc } = await import("drizzle-orm");

    return db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        projectName: orders.projectName,
        currentStage: orders.currentStage,
        total: orders.total,
        inHandsDate: orders.inHandsDate,
        createdAt: orders.createdAt,
        quoteStatus: orders.quoteStatus,
        salesOrderStatus: orders.salesOrderStatus,
      })
      .from(orders)
      .where(eq(orders.companyId, companyId))
      .orderBy(desc(orders.createdAt));
  }

  /**
   * Spending report for a company within a date range.
   * Counts only orders at Sales Order stage or beyond (excludes open quotes/presentations).
   * Returns totals, order count, breakdown by order, and a month-by-month summary.
   */
  async getSpendingReport(companyId: string, from?: string, to?: string) {
    const { db } = await import("../db");
    const { orders } = await import("@shared/schema");
    const { eq, and, gte, lte, inArray, desc, sql } = await import("drizzle-orm");

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();
    // Inclusive through end of "to" day
    const toEnd = new Date(toDate);
    toEnd.setHours(23, 59, 59, 999);

    // Only count revenue from orders that have actually been committed (SO or later)
    const committedStages = ["sales_order", "invoice"];

    const whereClauses = and(
      eq(orders.companyId, companyId),
      inArray(orders.currentStage, committedStages),
      gte(orders.createdAt, fromDate),
      lte(orders.createdAt, toEnd),
    );

    // Per-order breakdown
    const orderRows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        projectName: orders.projectName,
        currentStage: orders.currentStage,
        total: orders.total,
        createdAt: orders.createdAt,
        inHandsDate: orders.inHandsDate,
      })
      .from(orders)
      .where(whereClauses)
      .orderBy(desc(orders.createdAt));

    // Monthly aggregation
    const monthlyRows = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(whereClauses)
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    const totalSpend = orderRows.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);

    return {
      companyId,
      from: fromDate.toISOString(),
      to: toEnd.toISOString(),
      totalSpend,
      orderCount: orderRows.length,
      orders: orderRows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        projectName: o.projectName,
        currentStage: o.currentStage,
        total: parseFloat(o.total || "0"),
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
        inHandsDate: o.inHandsDate ? new Date(o.inHandsDate).toISOString() : null,
      })),
      monthly: monthlyRows.map((m) => ({
        month: m.month,
        total: parseFloat(m.total || "0"),
        count: m.count,
      })),
    };
  }
}

export const companyService = new CompanyService();
