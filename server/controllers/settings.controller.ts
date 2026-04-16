import type { Request, Response } from "express";
import { settingsService } from "../services/settings.service";
import { getUserId } from "../utils/getUserId";

export class SettingsController {
  // Admin / Company settings
  static async getCompanySettings(req: Request, res: Response) {
    const settings = await settingsService.getCompanySettings();
    res.json(settings);
  }

  static async updateFeatureToggles(req: Request, res: Response) {
    const userId = getUserId(req);
    const { featureToggles } = req.body;
    const settings = await settingsService.updateFeatureToggles(featureToggles, userId);
    res.json(settings);
  }

  static async updateGeneralSettings(req: Request, res: Response) {
    const userId = getUserId(req);
    const { timezone, currency, dateFormat, defaultMargin, minimumMargin, maxOrderValue, requireApprovalOver, orderNumberDigits } = req.body;
    const settings = await settingsService.updateGeneralSettings(
      { timezone, currency, dateFormat, defaultMargin, minimumMargin, maxOrderValue, requireApprovalOver, orderNumberDigits },
      userId
    );
    res.json(settings);
  }

  // Integration settings
  static async getIntegrationSettings(req: Request, res: Response) {
    const settings = await settingsService.getIntegrationSettings();
    res.json(settings);
  }

  static async saveIntegrationSettings(req: Request, res: Response) {
    const userId = getUserId(req);
    const savedSettings = await settingsService.saveIntegrationSettings(req.body, userId);
    res.json({ success: true, message: 'Integration settings saved successfully', settings: savedSettings });
  }

  // Branding
  static async getBranding(req: Request, res: Response) {
    const branding = await settingsService.getBranding();
    res.json(branding);
  }

  static async saveBranding(req: Request, res: Response) {
    const userId = getUserId(req);
    const result = await settingsService.saveBranding(req.body, userId);
    res.json(result);
  }

  static async uploadLogo(req: Request, res: Response) {
    const { logoUpload } = await import("../config/cloudinary");

    logoUpload.single('logo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Failed to upload logo" });
      }

      const file = req.file as Express.Multer.File & { path: string };
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        await settingsService.saveLogo(file.path, userId);
        res.json({ success: true, logoUrl: file.path, message: "Logo uploaded successfully" });
      } catch (error: any) {
        res.status(error.statusCode || 500).json({ message: error.message || "Failed to save logo" });
      }
    });
  }

  // User email settings
  static async getUserEmailSettings(req: Request, res: Response) {
    const userId = getUserId(req);
    const settings = await settingsService.getUserEmailSettings(userId);
    res.json(settings || null);
  }

  static async saveUserEmailSettings(req: Request, res: Response) {
    const userId = getUserId(req);
    const settings = await settingsService.saveUserEmailSettings(userId, req.body);
    res.json(settings);
  }

  static async deleteUserEmailSettings(req: Request, res: Response) {
    const userId = getUserId(req);
    await settingsService.deleteUserEmailSettings(userId);
    res.json({ success: true });
  }

  static async testEmail(req: Request, res: Response) {
    const { to } = req.body;
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.json({ success: false, message: 'Please provide a valid email address' });
    }
    const result = await settingsService.testEmail(to);
    res.json(result);
  }

  static async testSmtp(req: Request, res: Response) {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, testEmailTo } = req.body;
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return res.json({ success: false, message: "All SMTP fields are required" });
    }
    try {
      const result = await settingsService.testSmtp({ smtpHost, smtpPort, smtpUser, smtpPassword, testEmailTo });
      res.json(result);
    } catch (error: any) {
      res.json({ success: false, message: error.message || "SMTP connection failed" });
    }
  }

  static async testImap(req: Request, res: Response) {
    const { imapHost, imapPort, imapUser, imapPassword } = req.body;
    if (!imapHost || !imapPort || !imapUser || !imapPassword) {
      return res.json({ success: false, message: "All IMAP fields are required" });
    }
    const result = await settingsService.testImap({ imapHost, imapPort, imapUser, imapPassword });
    res.json(result);
  }

  // Email templates
  static async getEmailTemplates(req: Request, res: Response) {
    const type = req.query.type as string | undefined;
    const templates = await settingsService.getEmailTemplates(type);
    res.json(templates);
  }

  static async getEmailTemplate(req: Request, res: Response) {
    const template = await settingsService.getEmailTemplate(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  }

  static async createEmailTemplate(req: Request, res: Response) {
    const userId = getUserId(req);
    const { templateType, name, subject, body, isDefault, isActive } = req.body;
    if (!templateType || !name || !subject || !body) {
      return res.status(400).json({ message: "templateType, name, subject, and body are required" });
    }
    const template = await settingsService.createEmailTemplate(
      { templateType, name, subject, body, isDefault, isActive },
      userId
    );
    res.status(201).json(template);
  }

  static async updateEmailTemplate(req: Request, res: Response) {
    const userId = getUserId(req);
    const template = await settingsService.updateEmailTemplate(req.params.id, req.body, userId);
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  }

  static async deleteEmailTemplate(req: Request, res: Response) {
    await settingsService.deleteEmailTemplate(req.params.id);
    res.json({ success: true });
  }

  static async setDefaultEmailTemplate(req: Request, res: Response) {
    const userId = getUserId(req);
    const template = await settingsService.setDefaultEmailTemplate(req.params.id, userId);
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  }

  // Geocode
  static async geocodeSearch(req: Request, res: Response) {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.json({ suggestions: [] });
    }
    const result = await settingsService.geocodeSearch(q);
    res.json(result);
  }
}
