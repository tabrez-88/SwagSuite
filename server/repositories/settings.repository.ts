import { eq, and } from "drizzle-orm";
import { db } from "../db";

export class SettingsRepository {
  // Company / Admin settings
  async getCompanySettings(): Promise<any | undefined> {
    const { companySettings } = await import("@shared/schema");
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async upsertCompanySettings(settings: any, userId?: string): Promise<any> {
    const { companySettings } = await import("@shared/schema");
    const [existing] = await db.select().from(companySettings).limit(1);

    if (existing) {
      const [updated] = await db
        .update(companySettings)
        .set({ ...settings, updatedBy: userId, updatedAt: new Date() })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(companySettings)
      .values({ ...settings, updatedBy: userId })
      .returning();
    return created;
  }

  // Integration settings
  async getIntegrationSettings(): Promise<any | undefined> {
    const { integrationSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(integrationSettings).limit(1);
    return settings;
  }

  async upsertIntegrationSettings(settings: any, userId?: string): Promise<any> {
    const { integrationSettings } = await import("@shared/schema");
    const [existing] = await db.select().from(integrationSettings).limit(1);

    if (existing) {
      const [updated] = await db
        .update(integrationSettings)
        .set({ ...settings, updatedBy: userId, updatedAt: new Date() })
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(integrationSettings)
      .values({ ...settings, updatedBy: userId })
      .returning();
    return created;
  }

  async updateIntegrationSettings(settings: any): Promise<any> {
    const { integrationSettings } = await import("@shared/schema");
    const [existing] = await db.select().from(integrationSettings).limit(1);

    if (existing) {
      const [updated] = await db
        .update(integrationSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(integrationSettings)
      .values({ ...settings, updatedAt: new Date() })
      .returning();
    return created;
  }

  // System branding
  async getBranding(): Promise<any | undefined> {
    const { systemBranding } = await import("@shared/schema");
    const [branding] = await db.select().from(systemBranding).limit(1);
    return branding;
  }

  async upsertBranding(data: any, userId: string): Promise<any> {
    const { systemBranding } = await import("@shared/schema");
    const [existing] = await db.select().from(systemBranding).limit(1);

    if (existing) {
      const [updated] = await db
        .update(systemBranding)
        .set({ ...data, updatedBy: userId, updatedAt: new Date() })
        .where(eq(systemBranding.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(systemBranding)
      .values({ ...data, updatedBy: userId })
      .returning();
    return created;
  }

  // User email settings
  async getUserEmailSettings(userId: string): Promise<any | undefined> {
    const { userEmailSettings } = await import("@shared/schema");
    const [settings] = await db
      .select()
      .from(userEmailSettings)
      .where(eq(userEmailSettings.userId, userId))
      .limit(1);
    return settings;
  }

  async upsertUserEmailSettings(userId: string, data: any): Promise<any> {
    const { userEmailSettings } = await import("@shared/schema");
    const [existing] = await db
      .select()
      .from(userEmailSettings)
      .where(eq(userEmailSettings.userId, userId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userEmailSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userEmailSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userEmailSettings)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async deleteUserEmailSettings(id: string): Promise<void> {
    const { userEmailSettings } = await import("@shared/schema");
    await db.delete(userEmailSettings).where(eq(userEmailSettings.id, id));
  }

  // Email templates
  async getEmailTemplates(type?: string): Promise<any[]> {
    const { emailTemplates } = await import("@shared/schema");
    if (type) {
      return db.select().from(emailTemplates).where(eq(emailTemplates.templateType, type));
    }
    return db.select().from(emailTemplates);
  }

  async getEmailTemplate(id: string): Promise<any | undefined> {
    const { emailTemplates } = await import("@shared/schema");
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(data: any): Promise<any> {
    const { emailTemplates } = await import("@shared/schema");
    const [created] = await db.insert(emailTemplates).values(data).returning();
    return created;
  }

  async updateEmailTemplate(id: string, data: any): Promise<any> {
    const { emailTemplates } = await import("@shared/schema");
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    const { emailTemplates } = await import("@shared/schema");
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async clearDefaultForType(templateType: string): Promise<void> {
    const { emailTemplates } = await import("@shared/schema");
    await db
      .update(emailTemplates)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(emailTemplates.templateType, templateType), eq(emailTemplates.isDefault, true)));
  }

  // User role check
  async getUserRole(userId: string): Promise<string | null> {
    const { users } = await import("@shared/schema");
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    return user?.role || null;
  }
}

export const settingsRepository = new SettingsRepository();
