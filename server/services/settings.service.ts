import { settingsRepository } from "../repositories/settings.repository";
import { ForbiddenError } from "../errors/AppError";

const DEFAULT_COMPANY_SETTINGS = {
  featureToggles: {},
  timezone: "America/New_York",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  defaultMargin: "30",
  minimumMargin: "15",
  maxOrderValue: "50000",
  requireApprovalOver: "5000",
};

const DEFAULT_BRANDING = {
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  logoUrl: null,
  logoSize: 'medium',
  logoPosition: 'left',
  faviconUrl: null,
  companyName: 'SwagSuite',
  tagline: null,
  borderRadius: 'medium',
  fontFamily: 'inter',
  sidebarBackgroundColor: '#014559',
  sidebarTextColor: '#ffffff',
  sidebarBorderColor: '#374151',
  navHoverColor: '#374151',
  navActiveColor: '#3b82f6',
  navTextColor: '#d1d5db',
  navTextActiveColor: '#ffffff',
  borderColor: '#e5e7eb',
};

export class SettingsService {
  // Admin / Company settings
  async getCompanySettings() {
    const settings = await settingsRepository.getCompanySettings();
    return settings || DEFAULT_COMPANY_SETTINGS;
  }

  async updateFeatureToggles(featureToggles: any, userId: string) {
    return settingsRepository.upsertCompanySettings({ featureToggles }, userId);
  }

  async updateGeneralSettings(data: {
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    defaultMargin?: string;
    minimumMargin?: string;
    maxOrderValue?: string;
    requireApprovalOver?: string;
  }, userId: string) {
    return settingsRepository.upsertCompanySettings(data, userId);
  }

  // Integration settings
  async getIntegrationSettings() {
    const dbSettings = await settingsRepository.getIntegrationSettings();

    return {
      ssActivewearAccount: dbSettings?.ssActivewearAccount || process.env.SS_ACTIVEWEAR_ACCOUNT?.trim() || "",
      ssActivewearApiKey: dbSettings?.ssActivewearApiKey || process.env.SS_ACTIVEWEAR_API_KEY?.trim() || "",
      sanmarCustomerId: dbSettings?.sanmarCustomerId || process.env.SANMAR_CUSTOMER_ID?.trim() || "",
      sanmarUsername: dbSettings?.sanmarUsername || process.env.SANMAR_USERNAME?.trim() || "",
      sanmarPassword: dbSettings?.sanmarPassword || process.env.SANMAR_PASSWORD?.trim() || "",
      hubspotApiKey: dbSettings?.hubspotApiKey || process.env.HUBSPOT_API_KEY?.trim() || "",
      slackBotToken: dbSettings?.slackBotToken || process.env.SLACK_BOT_TOKEN?.trim() || "",
      slackChannelId: dbSettings?.slackChannelId || process.env.SLACK_CHANNEL_ID?.trim() || "",
      sageAcctId: dbSettings?.sageAcctId || process.env.SAGE_ACCT_ID?.trim() || "",
      sageLoginId: dbSettings?.sageLoginId || process.env.SAGE_LOGIN_ID?.trim() || "",
      sageApiKey: dbSettings?.sageApiKey || process.env.SAGE_API_KEY?.trim() || "",
      geoapifyApiKey: dbSettings?.geoapifyApiKey || process.env.GEOAPIFY_API_KEY?.trim() || "",
      quickbooksConnected: dbSettings?.quickbooksConnected || false,
      stripeConnected: dbSettings?.stripeConnected || false,
      shipmateConnected: dbSettings?.shipmateConnected || false,
      stripePublishableKey: dbSettings?.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY?.trim() || "",
      stripeSecretKey: dbSettings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY?.trim() || "",
      stripeWebhookSecret: dbSettings?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET?.trim() || "",
      taxjarApiKey: dbSettings?.taxjarApiKey || process.env.TAXJAR_API_KEY?.trim() || "",
      taxOriginStreet: dbSettings?.taxOriginStreet || "",
      taxOriginCity: dbSettings?.taxOriginCity || "",
      taxOriginState: dbSettings?.taxOriginState || "",
      taxOriginZip: dbSettings?.taxOriginZip || "",
      taxOriginCountry: dbSettings?.taxOriginCountry || "US",
    };
  }

  async saveIntegrationSettings(settings: any, userId: string) {
    // Auto-update connected flags based on provided keys
    if (settings.stripePublishableKey && settings.stripeSecretKey) {
      settings.stripeConnected = true;
    } else if (settings.stripePublishableKey === "" || settings.stripeSecretKey === "") {
      settings.stripeConnected = false;
    }

    return settingsRepository.upsertIntegrationSettings(settings, userId);
  }

  // Branding
  async getBranding() {
    const branding = await settingsRepository.getBranding();
    return branding || DEFAULT_BRANDING;
  }

  async saveBranding(data: any, userId: string) {
    await this.requireAdminOrManager(userId);
    return settingsRepository.upsertBranding(data, userId);
  }

  async saveLogo(logoUrl: string, userId: string) {
    await this.requireAdminOrManager(userId);
    return settingsRepository.upsertBranding({ logoUrl }, userId);
  }

  // User email settings
  async getUserEmailSettings(userId: string) {
    return settingsRepository.getUserEmailSettings(userId);
  }

  async saveUserEmailSettings(userId: string, data: any) {
    return settingsRepository.upsertUserEmailSettings(userId, data);
  }

  async deleteUserEmailSettings(userId: string) {
    const existing = await settingsRepository.getUserEmailSettings(userId);
    if (existing) {
      await settingsRepository.deleteUserEmailSettings(existing.id);
    }
  }

  async testEmail(to: string) {
    const { emailService } = await import('./email.service');
    const success = await emailService.testConnection(to);
    return { success, message: success ? `Test email sent to ${to}` : 'Failed to send test email' };
  }

  async testSmtp(data: { smtpHost: string; smtpPort: number; smtpUser: string; smtpPassword: string; testEmailTo?: string }) {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, testEmailTo } = data;
    const nodemailer = (await import("nodemailer")).default;

    const testTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      tls: { rejectUnauthorized: false },
    });

    await testTransporter.verify();

    if (testEmailTo && testEmailTo.includes("@")) {
      await testTransporter.sendMail({
        from: smtpUser,
        to: testEmailTo,
        subject: "SwagSuite - SMTP Test (Personal Account)",
        text: "Your personal SMTP settings are working correctly.",
        html: "<p>Your personal SMTP settings are working correctly.</p>",
      });
    }

    return { success: true, message: "SMTP connection verified successfully" };
  }

  async testImap(data: { imapHost: string; imapPort: number; imapUser: string; imapPassword: string }) {
    return {
      success: true,
      message: "IMAP settings saved. Full IMAP connectivity will be validated on first use.",
    };
  }

  // Geocode proxy
  async geocodeSearch(query: string) {
    const dbSettings = await settingsRepository.getIntegrationSettings();
    const geoapifyKey = dbSettings?.geoapifyApiKey || process.env.GEOAPIFY_API_KEY?.trim();

    if (!geoapifyKey) {
      return { suggestions: [], configured: false };
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodedQuery}&apiKey=${geoapifyKey}&limit=5&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify API returned ${response.status}`);
    }

    const data = await response.json();

    const suggestions = (data.results || []).map((result: any) => ({
      id: result.place_id || result.formatted,
      fullAddress: result.formatted || "",
      streetAddress: [result.housenumber, result.street].filter(Boolean).join(" ") || result.address_line1 || "",
      city: result.city || result.town || result.village || "",
      state: result.state || "",
      stateCode: result.state_code?.toUpperCase() || "",
      zipCode: result.postcode || "",
      country: result.country_code?.toUpperCase() || "",
    }));

    return { suggestions };
  }

  private async requireAdminOrManager(userId: string) {
    const role = await settingsRepository.getUserRole(userId);
    if (role !== 'admin' && role !== 'manager') {
      throw new ForbiddenError("Only admins and managers can perform this action");
    }
  }
}

export const settingsService = new SettingsService();
