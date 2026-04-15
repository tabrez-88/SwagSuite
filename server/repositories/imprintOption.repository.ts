import { and, asc, eq, desc, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  imprintOptions,
  imprintOptionSuggestions,
  type ImprintOption,
  type ImprintOptionSuggestion,
  type ImprintOptionType,
} from "@shared/schema";

function normalizeLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export class ImprintOptionRepository {
  static async list(type?: ImprintOptionType, includeInactive = false): Promise<ImprintOption[]> {
    const conditions = [];
    if (type) conditions.push(eq(imprintOptions.type, type));
    if (!includeInactive) conditions.push(eq(imprintOptions.isActive, true));

    return db
      .select()
      .from(imprintOptions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(imprintOptions.displayOrder), asc(imprintOptions.label));
  }

  static async create(data: {
    type: ImprintOptionType;
    label: string;
    value?: string;
    displayOrder?: number;
    isActive?: boolean;
    isBuiltIn?: boolean;
  }): Promise<ImprintOption> {
    const value = data.value || slugify(data.label);
    const [row] = await db
      .insert(imprintOptions)
      .values({
        type: data.type,
        value,
        label: data.label,
        displayOrder: data.displayOrder ?? 999,
        isActive: data.isActive ?? true,
        isBuiltIn: data.isBuiltIn ?? false,
      })
      .returning();
    return row;
  }

  static async update(
    id: string,
    data: Partial<Pick<ImprintOption, "label" | "displayOrder" | "isActive">>,
  ): Promise<ImprintOption | null> {
    const [row] = await db
      .update(imprintOptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(imprintOptions.id, id))
      .returning();
    return row ?? null;
  }

  static async getById(id: string): Promise<ImprintOption | null> {
    const [row] = await db.select().from(imprintOptions).where(eq(imprintOptions.id, id));
    return row ?? null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(imprintOptions).where(eq(imprintOptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Suggestions ---------------------------------------------------------

  static async listSuggestions(status?: string): Promise<ImprintOptionSuggestion[]> {
    const conditions = status ? [eq(imprintOptionSuggestions.status, status)] : [];
    return db
      .select()
      .from(imprintOptionSuggestions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(imprintOptionSuggestions.createdAt));
  }

  static async pendingCount(): Promise<number> {
    const rows = await db
      .select({ id: imprintOptionSuggestions.id })
      .from(imprintOptionSuggestions)
      .where(eq(imprintOptionSuggestions.status, "pending"));
    return rows.length;
  }

  static async createSuggestion(data: {
    type: ImprintOptionType;
    label: string;
    suggestedBy?: string;
    suggestedFromOrderId?: string;
    note?: string;
  }): Promise<{
    suggestion: ImprintOptionSuggestion | null;
    duplicate: boolean;
    reason?: "already_option" | "pending_duplicate";
    existingOption?: ImprintOption;
  }> {
    const normalized = normalizeLabel(data.label);
    const slug = slugify(data.label);

    // 1. Dedup against canonical options table — if already exists (by value or label),
    //    no need to create a suggestion at all.
    const [existingOption] = await db
      .select()
      .from(imprintOptions)
      .where(
        and(
          eq(imprintOptions.type, data.type),
          or(
            eq(imprintOptions.value, slug),
            sql`LOWER(${imprintOptions.label}) = ${normalized}`,
          ),
        ),
      );
    if (existingOption) {
      return {
        suggestion: null,
        duplicate: true,
        reason: "already_option",
        existingOption,
      };
    }

    // 2. Dedup against pending suggestions from any user.
    const [existingPending] = await db
      .select()
      .from(imprintOptionSuggestions)
      .where(
        and(
          eq(imprintOptionSuggestions.type, data.type),
          eq(imprintOptionSuggestions.normalizedLabel, normalized),
          eq(imprintOptionSuggestions.status, "pending"),
        ),
      );
    if (existingPending) {
      return { suggestion: existingPending, duplicate: true, reason: "pending_duplicate" };
    }

    const [row] = await db
      .insert(imprintOptionSuggestions)
      .values({
        type: data.type,
        label: data.label,
        normalizedLabel: normalized,
        suggestedBy: data.suggestedBy,
        suggestedFromOrderId: data.suggestedFromOrderId,
        note: data.note,
        status: "pending",
      })
      .returning();
    return { suggestion: row, duplicate: false };
  }

  static async getSuggestion(id: string): Promise<ImprintOptionSuggestion | null> {
    const [row] = await db
      .select()
      .from(imprintOptionSuggestions)
      .where(eq(imprintOptionSuggestions.id, id));
    return row ?? null;
  }

  static async approveSuggestion(
    id: string,
    reviewerId: string,
  ): Promise<{ option: ImprintOption; suggestion: ImprintOptionSuggestion } | null> {
    const suggestion = await this.getSuggestion(id);
    if (!suggestion || suggestion.status !== "pending") return null;

    // Create the option first; if value already exists, fetch existing.
    const value = slugify(suggestion.label);
    let option: ImprintOption;
    const [existingOpt] = await db
      .select()
      .from(imprintOptions)
      .where(
        and(
          eq(imprintOptions.type, suggestion.type),
          eq(imprintOptions.value, value),
        ),
      );
    if (existingOpt) {
      option = existingOpt;
      if (!existingOpt.isActive) {
        const [reactivated] = await db
          .update(imprintOptions)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(imprintOptions.id, existingOpt.id))
          .returning();
        option = reactivated;
      }
    } else {
      option = await this.create({
        type: suggestion.type as ImprintOptionType,
        label: suggestion.label,
        value,
        isBuiltIn: false,
      });
    }

    const [updated] = await db
      .update(imprintOptionSuggestions)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        approvedOptionId: option.id,
        updatedAt: new Date(),
      })
      .where(eq(imprintOptionSuggestions.id, id))
      .returning();

    return { option, suggestion: updated };
  }

  static async rejectSuggestion(
    id: string,
    reviewerId: string,
    note?: string,
  ): Promise<ImprintOptionSuggestion | null> {
    const [row] = await db
      .update(imprintOptionSuggestions)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        note: note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(imprintOptionSuggestions.id, id))
      .returning();
    return row ?? null;
  }
}

export { normalizeLabel, slugify };
