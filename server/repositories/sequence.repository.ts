import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  sequences,
  sequenceSteps,
  sequenceEnrollments,
  sequenceAnalytics,
  type Sequence,
  type InsertSequence,
  type SequenceStep,
  type InsertSequenceStep,
  type SequenceEnrollment,
  type InsertSequenceEnrollment,
  type SequenceAnalytics,
  type InsertSequenceAnalytics,
} from "@shared/schema";

export class SequenceRepository {
  // ── Sequences ──

  async getSequences(userId?: string): Promise<Sequence[]> {
    const query = db.select().from(sequences);
    if (userId) {
      query.where(eq(sequences.userId, userId));
    }
    return await query.orderBy(desc(sequences.createdAt));
  }

  async getSequence(id: string): Promise<Sequence | undefined> {
    const [sequence] = await db
      .select()
      .from(sequences)
      .where(eq(sequences.id, id));
    return sequence;
  }

  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const [newSequence] = await db
      .insert(sequences)
      .values(sequence)
      .returning();
    return newSequence;
  }

  async updateSequence(
    id: string,
    sequence: Partial<InsertSequence>
  ): Promise<Sequence> {
    const [updatedSequence] = await db
      .update(sequences)
      .set({ ...sequence, updatedAt: new Date() })
      .where(eq(sequences.id, id))
      .returning();
    return updatedSequence;
  }

  async deleteSequence(id: string): Promise<void> {
    await db.delete(sequences).where(eq(sequences.id, id));
  }

  // ── Sequence Steps ──

  async getSequenceSteps(sequenceId: string): Promise<SequenceStep[]> {
    return await db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId))
      .orderBy(sequenceSteps.position);
  }

  async createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep> {
    const [newStep] = await db
      .insert(sequenceSteps)
      .values(step)
      .returning();
    return newStep;
  }

  async updateSequenceStep(
    id: string,
    step: Partial<InsertSequenceStep>
  ): Promise<SequenceStep> {
    const [updatedStep] = await db
      .update(sequenceSteps)
      .set({ ...step, updatedAt: new Date() })
      .where(eq(sequenceSteps.id, id))
      .returning();
    return updatedStep;
  }

  async deleteSequenceStep(id: string): Promise<void> {
    await db.delete(sequenceSteps).where(eq(sequenceSteps.id, id));
  }

  // ── Sequence Enrollments ──

  async getSequenceEnrollments(
    sequenceId?: string
  ): Promise<SequenceEnrollment[]> {
    const query = db.select().from(sequenceEnrollments);
    if (sequenceId) {
      query.where(eq(sequenceEnrollments.sequenceId, sequenceId));
    }
    return await query.orderBy(desc(sequenceEnrollments.enrolledAt));
  }

  async createSequenceEnrollment(
    enrollment: InsertSequenceEnrollment
  ): Promise<SequenceEnrollment> {
    const [newEnrollment] = await db
      .insert(sequenceEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async updateSequenceEnrollment(
    id: string,
    enrollment: Partial<InsertSequenceEnrollment>
  ): Promise<SequenceEnrollment> {
    const [updatedEnrollment] = await db
      .update(sequenceEnrollments)
      .set(enrollment)
      .where(eq(sequenceEnrollments.id, id))
      .returning();
    return updatedEnrollment;
  }

  // ── Sequence Analytics ──

  async getSequenceAnalytics(
    sequenceId: string
  ): Promise<SequenceAnalytics[]> {
    return await db
      .select()
      .from(sequenceAnalytics)
      .where(eq(sequenceAnalytics.sequenceId, sequenceId))
      .orderBy(desc(sequenceAnalytics.date));
  }

  async createSequenceAnalytics(
    analytics: InsertSequenceAnalytics
  ): Promise<SequenceAnalytics> {
    const [newAnalytics] = await db
      .insert(sequenceAnalytics)
      .values(analytics)
      .returning();
    return newAnalytics;
  }
}

export const sequenceRepository = new SequenceRepository();
