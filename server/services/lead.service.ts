import type { InsertLead } from "@shared/schema";
import { leadRepository } from "../repositories/lead.repository";
import { db } from "../db";
import { contacts, leads } from "@shared/schema";
import { sql, isNotNull } from "drizzle-orm";

export class LeadService {
  async getAll() {
    return leadRepository.getAll();
  }

  async create(data: InsertLead) {
    return leadRepository.create(data);
  }

  async update(id: string, data: Partial<InsertLead>) {
    return leadRepository.update(id, data);
  }

  async delete(id: string) {
    return leadRepository.delete(id);
  }

  async getLeadSourceReport() {
    const contactCounts = await db
      .select({
        source: contacts.leadSource,
        count: sql<number>`count(*)::int`,
      })
      .from(contacts)
      .where(isNotNull(contacts.leadSource))
      .groupBy(contacts.leadSource);

    const leadCounts = await db
      .select({
        source: leads.source,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .groupBy(leads.source);

    const sourceMap = new Map<string, { contacts: number; leads: number }>();
    for (const row of contactCounts) {
      if (row.source) {
        sourceMap.set(row.source, { contacts: row.count, leads: 0 });
      }
    }
    for (const row of leadCounts) {
      if (row.source) {
        const existing = sourceMap.get(row.source) || { contacts: 0, leads: 0 };
        existing.leads = row.count;
        sourceMap.set(row.source, existing);
      }
    }

    return Array.from(sourceMap.entries())
      .map(([source, counts]) => ({
        source,
        contacts: counts.contacts,
        leads: counts.leads,
        total: counts.contacts + counts.leads,
      }))
      .sort((a, b) => b.total - a.total);
  }
}

export const leadService = new LeadService();
