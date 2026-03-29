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
    return { ...company, addresses };
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
}

export const companyService = new CompanyService();
