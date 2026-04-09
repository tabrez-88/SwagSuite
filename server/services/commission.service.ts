import { db } from "../db";
import { orders, users, invoices, companies } from "@shared/schema";
import { and, eq, gte, lte, sql, isNotNull } from "drizzle-orm";

export interface CommissionLineItem {
  orderId: string;
  orderNumber: string;
  projectName: string | null;
  companyName: string | null;
  total: number;
  margin: number;
  grossProfit: number;
  commissionAmount: number;
  paidAt: string | null;
}

export interface RepCommissionReport {
  userId: string;
  name: string;
  email: string | null;
  commissionPercent: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalCommission: number;
  orderCount: number;
  orders: CommissionLineItem[];
}

export interface CommissionReport {
  from: string;
  to: string;
  reps: RepCommissionReport[];
  grandTotalRevenue: number;
  grandTotalGrossProfit: number;
  grandTotalCommission: number;
}

export class CommissionService {
  /**
   * Generate commission report for a date range.
   *
   * Qualifying orders:
   * - Invoice status = 'paid'
   * - Invoice paidAt within date range
   * - Order has an assignedUserId
   *
   * Gross profit = order.total × (order.margin / 100)
   * Commission = grossProfit × (user.commissionPercent / 100)
   */
  async getReport(from?: string, to?: string): Promise<CommissionReport> {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : now;
    const toEnd = new Date(toDate);
    toEnd.setHours(23, 59, 59, 999);

    // Get all reps with commission configured
    const reps = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        commissionPercent: users.commissionPercent,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.commissionPercent),
          eq(users.isActive, true),
        ),
      );

    const repReports: RepCommissionReport[] = [];

    for (const rep of reps) {
      const pct = parseFloat(rep.commissionPercent || "0");
      if (pct <= 0) continue;

      // Get qualifying paid orders assigned to this rep within date range
      const qualifyingOrders = await db
        .select({
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          projectName: orders.projectName,
          companyName: companies.name,
          total: orders.total,
          margin: orders.margin,
          paidAt: invoices.paidAt,
        })
        .from(orders)
        .innerJoin(invoices, eq(invoices.orderId, orders.id))
        .leftJoin(companies, eq(orders.companyId, companies.id))
        .where(
          and(
            eq(orders.assignedUserId, rep.id),
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, fromDate),
            lte(invoices.paidAt, toEnd),
          ),
        );

      const lineItems: CommissionLineItem[] = qualifyingOrders.map((o) => {
        const total = parseFloat(o.total || "0");
        const marginPct = parseFloat(o.margin || "0");
        const grossProfit = total * (marginPct / 100);
        const commissionAmount = grossProfit * (pct / 100);
        return {
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          projectName: o.projectName,
          companyName: o.companyName,
          total,
          margin: marginPct,
          grossProfit: Math.round(grossProfit * 100) / 100,
          commissionAmount: Math.round(commissionAmount * 100) / 100,
          paidAt: o.paidAt ? new Date(o.paidAt).toISOString() : null,
        };
      });

      const totalRevenue = lineItems.reduce((s, l) => s + l.total, 0);
      const totalGrossProfit = lineItems.reduce((s, l) => s + l.grossProfit, 0);
      const totalCommission = lineItems.reduce((s, l) => s + l.commissionAmount, 0);

      repReports.push({
        userId: rep.id,
        name: `${rep.firstName || ""} ${rep.lastName || ""}`.trim() || "Unknown",
        email: rep.email,
        commissionPercent: pct,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        orderCount: lineItems.length,
        orders: lineItems,
      });
    }

    // Sort by total commission desc
    repReports.sort((a, b) => b.totalCommission - a.totalCommission);

    return {
      from: fromDate.toISOString(),
      to: toEnd.toISOString(),
      reps: repReports,
      grandTotalRevenue: Math.round(repReports.reduce((s, r) => s + r.totalRevenue, 0) * 100) / 100,
      grandTotalGrossProfit: Math.round(repReports.reduce((s, r) => s + r.totalGrossProfit, 0) * 100) / 100,
      grandTotalCommission: Math.round(repReports.reduce((s, r) => s + r.totalCommission, 0) * 100) / 100,
    };
  }

  /**
   * Update a user's commission percentage.
   */
  async setCommissionPercent(userId: string, percent: number): Promise<void> {
    await db
      .update(users)
      .set({ commissionPercent: percent.toFixed(2) })
      .where(eq(users.id, userId));
  }
}

export const commissionService = new CommissionService();
