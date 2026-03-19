import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import {
  vendorApprovalRequests,
  type VendorApprovalRequest,
  type InsertVendorApprovalRequest,
} from "@shared/schema";

export class VendorApprovalRepository {
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
}

export const vendorApprovalRepository = new VendorApprovalRepository();
