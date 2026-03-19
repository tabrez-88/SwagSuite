import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import {
  errors,
  type Error,
  type InsertError,
} from "@shared/schema";

export class ErrorRepository {
  async getErrors(): Promise<Error[]> {
    return await db.select().from(errors).orderBy(desc(errors.date));
  }

  async getError(id: string): Promise<Error | undefined> {
    const [error] = await db
      .select()
      .from(errors)
      .where(eq(errors.id, id));
    return error;
  }

  async createError(error: InsertError): Promise<Error> {
    const [newError] = await db
      .insert(errors)
      .values({
        ...error,
        date: error.date || new Date(),
      })
      .returning();
    return newError;
  }

  async updateError(id: string, error: Partial<InsertError>): Promise<Error> {
    const [updatedError] = await db
      .update(errors)
      .set({ ...error, updatedAt: new Date() })
      .where(eq(errors.id, id))
      .returning();
    return updatedError;
  }

  async deleteError(id: string): Promise<void> {
    await db.delete(errors).where(eq(errors.id, id));
  }

  async getErrorsByOrder(orderId: string): Promise<Error[]> {
    return await db
      .select()
      .from(errors)
      .where(eq(errors.orderId, orderId))
      .orderBy(desc(errors.date));
  }

  async getErrorsByType(errorType: string): Promise<Error[]> {
    return await db
      .select()
      .from(errors)
      .where(eq(errors.errorType, errorType as any))
      .orderBy(desc(errors.date));
  }

  async getErrorsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Error[]> {
    return await db
      .select()
      .from(errors)
      .where(and(gte(errors.date, startDate), lte(errors.date, endDate)))
      .orderBy(desc(errors.date));
  }
}

export const errorRepository = new ErrorRepository();
