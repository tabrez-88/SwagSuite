import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { integrationRepository } from '../repositories/integration.repository';
import { settingsRepository } from '../repositories/settings.repository';
import { userRepository } from '../repositories/user.repository';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
}

class EmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

  async initialize() {
    const settings = await integrationRepository.getIntegrationSettings();

    if (!settings?.smtpHost || !settings?.smtpPort || !settings?.smtpUser || !settings?.smtpPassword) {
      throw new Error('SMTP credentials not configured. Please configure SMTP settings in Settings → Email Config.');
    }

    // Create nodemailer transporter with SMTP settings
    this.transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
      tls: {
        // Don't fail on invalid certs (useful for development)
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await this.transporter.verify();
  }

  // Create a per-user transporter from their SMTP settings
  private async createUserTransporter(userId: string): Promise<Transporter<SMTPTransport.SentMessageInfo> | null> {
    const userSettings = await settingsRepository.getUserEmailSettings(userId);

    if (!userSettings?.smtpHost || !userSettings?.smtpPort ||
        !userSettings?.smtpUser || !userSettings?.smtpPassword) {
      return null;
    }

    return nodemailer.createTransport({
      host: userSettings.smtpHost,
      port: userSettings.smtpPort,
      secure: userSettings.smtpPort === 465,
      auth: {
        user: userSettings.smtpUser,
        pass: userSettings.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });
  }

  // Get the appropriate transporter (per-user or system fallback)
  private async getTransporterForUser(userId?: string): Promise<{
    transporter: Transporter<SMTPTransport.SentMessageInfo>;
    fromEmail: string;
    fromName: string;
  }> {
    // Try user-specific transporter first
    if (userId) {
      const userSettings = await settingsRepository.getUserEmailSettings(userId);
      console.log(`📧 getTransporterForUser: userId=${userId}, hasUserSettings=${!!userSettings}, useDefault=${userSettings?.useDefaultForCompose}`);

      if (userSettings && !userSettings.useDefaultForCompose) {
        const userTransporter = await this.createUserTransporter(userId);
        if (userTransporter) {
          const user = await userRepository.getUser(userId);
          const fromName = userSettings.hideNameOnSend
            ? 'SwagSuite'
            : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'SwagSuite';

          console.log(`📧 Using per-user transporter: ${userSettings.smtpUser}`);
          return {
            transporter: userTransporter,
            fromEmail: userSettings.smtpUser || '',
            fromName,
          };
        }
      }
    }

    console.log('📧 Using system-wide transporter (fallback)');

    // Fallback to system-wide transporter
    if (!this.transporter) {
      await this.initialize();
    }
    if (!this.transporter) {
      throw new Error('No email transporter available');
    }

    const settings = await integrationRepository.getIntegrationSettings();
    // Use smtpUser as FROM since most SMTP servers only allow sending from the authenticated account
    return {
      transporter: this.transporter,
      fromEmail: settings?.smtpUser || settings?.emailFromAddress || 'noreply@example.com',
      fromName: settings?.emailFromName || 'SwagSuite',
    };
  }

  async sendEmail(options: EmailOptions) {
    const { transporter, fromEmail, fromName } = await this.getTransporterForUser(options.userId);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('✓ Email sent:', info.messageId);
    return { id: info.messageId, ...info };
  }

  async sendClientEmail(data: {
    userId?: string;
    from?: string;
    fromName?: string;
    to: string;
    toName?: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    orderNumber?: string;
    companyName?: string;
    attachments?: Array<{ storagePath: string; originalFilename: string; mimeType?: string }>;
    directAttachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
  }) {
    const { transporter, fromEmail: defaultFrom, fromName: defaultFromName } =
      await this.getTransporterForUser(data.userId);

    // Always use the transporter's authenticated email as FROM address
    // SMTP servers reject sending from domains that don't match the authenticated account
    const fromEmail = defaultFrom;
    const fromName = data.fromName || defaultFromName;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(data.subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">Liquid Screen Design</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-family: Arial, sans-serif;">${this.escapeHtml(data.subject)}</h2>
              ${data.orderNumber || data.companyName ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 20px;">
                <tr><td style="padding: 15px;">
                  ${data.orderNumber ? `<p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Order #:</strong> ${this.escapeHtml(data.orderNumber)}</p>` : ''}
                  ${data.companyName ? `<p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Company:</strong> ${this.escapeHtml(data.companyName)}</p>` : ''}
                </td></tr>
              </table>
              ` : ''}
              <div style="color: #374151; line-height: 1.6; font-size: 14px; font-family: Arial, sans-serif;">
                ${this.formatEmailBody(data.body)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">Sent by ${this.escapeHtml(fromName)} · Liquid Screen Design</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: data.from || fromEmail,
      to: data.to,
      toName: data.toName,
      subject: data.subject,
      html,
      text: this.stripHtml(data.body),
    };

    // Add CC if provided
    if (data.cc) {
      mailOptions.cc = data.cc;
    }

    // Add BCC if provided
    if (data.bcc) {
      mailOptions.bcc = data.bcc;
    }

    // Add attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      const { storageService } = await import('./storage.service');
      mailOptions.attachments = await Promise.all(
        data.attachments.map(async (att) => {
          let buffer: Buffer | null = null;
          // If storagePath is a full URL (Cloudinary), download directly
          if (att.storagePath.startsWith('http://') || att.storagePath.startsWith('https://')) {
            const axios = (await import('axios')).default;
            const response = await axios.get(att.storagePath, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
          } else {
            buffer = await storageService.downloadFile(att.storagePath);
          }
          return {
            filename: att.originalFilename,
            content: buffer,
            contentType: att.mimeType,
          };
        })
      );
    }

    // Merge direct attachments (pre-downloaded buffers, e.g. auto-attached Quote PDF)
    if (data.directAttachments && data.directAttachments.length > 0) {
      if (!mailOptions.attachments) mailOptions.attachments = [];
      mailOptions.attachments.push(...data.directAttachments);
    }

    const info = await transporter.sendMail(mailOptions);

    console.log('✓ Email sent:', info.messageId);
    return { id: info.messageId, ...info };
  }

  async sendVendorEmail(data: {
    userId?: string;
    from?: string;
    fromName?: string;
    to: string;
    toName?: string;    cc?: string;
    bcc?: string;    subject: string;
    body: string;
    orderNumber?: string;
    supplierName?: string;
    attachments?: Array<{ storagePath: string; originalFilename: string; mimeType?: string }>;
    directAttachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
  }) {
    const { transporter, fromEmail: defaultFrom, fromName: defaultFromName } =
      await this.getTransporterForUser(data.userId);

    // Always use the transporter's authenticated email as FROM address
    const fromEmail = defaultFrom;
    const fromName = data.fromName || defaultFromName;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(data.subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #059669; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">Liquid Screen Design</h1>
              <p style="color: #d1fae5; margin: 0 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">Vendor Communication</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-family: Arial, sans-serif;">${this.escapeHtml(data.subject)}</h2>
              ${data.orderNumber || data.supplierName ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 20px;">
                <tr><td style="padding: 15px;">
                  ${data.orderNumber ? `<p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>PO #:</strong> ${this.escapeHtml(data.orderNumber)}</p>` : ''}
                  ${data.supplierName ? `<p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Vendor:</strong> ${this.escapeHtml(data.supplierName)}</p>` : ''}
                </td></tr>
              </table>
              ` : ''}
              <div style="color: #374151; line-height: 1.6; font-size: 14px; font-family: Arial, sans-serif;">
                ${this.formatEmailBody(data.body)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">Sent by ${this.escapeHtml(fromName)} · Liquid Screen Design</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const vendorMailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: data.from || fromEmail,
      to: data.to,
      toName: data.toName,
      subject: data.subject,
      html,
      text: this.stripHtml(data.body),
    };

    // Add CC if provided
    if (data.cc) {
      vendorMailOptions.cc = data.cc;
    }

    // Add BCC if provided
    if (data.bcc) {
      vendorMailOptions.bcc = data.bcc;
    }

    // Add attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      const { storageService } = await import('./storage.service');
      vendorMailOptions.attachments = await Promise.all(
        data.attachments.map(async (att) => {
          let buffer: Buffer | null = null;
          // If storagePath is a full URL (Cloudinary), download directly
          if (att.storagePath.startsWith('http://') || att.storagePath.startsWith('https://')) {
            const axios = (await import('axios')).default;
            const response = await axios.get(att.storagePath, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
          } else {
            buffer = await storageService.downloadFile(att.storagePath);
          }
          return {
            filename: att.originalFilename,
            content: buffer,
            contentType: att.mimeType,
          };
        })
      );
    }

    // Add direct buffer attachments (e.g. PO document PDF downloaded from Cloudinary)
    if (data.directAttachments && data.directAttachments.length > 0) {
      if (!vendorMailOptions.attachments) {
        vendorMailOptions.attachments = [];
      }
      vendorMailOptions.attachments.push(...data.directAttachments);
    }

    const info = await transporter.sendMail(vendorMailOptions);

    console.log('✓ Email sent:', info.messageId);
    return { id: info.messageId, ...info };
  }

  /**
   * Detect whether body contains real HTML markup (not arbitrary <text>).
   * Looks for known block/inline tags rather than any "<word>" pattern,
   * so user content like <john@x.com> or <ORD123> is treated as plain text.
   */
  private looksLikeHtml(body: string): boolean {
    return /<\/?(p|br|div|span|h[1-6]|ul|ol|li|strong|em|b|i|u|a|table|tr|td|th|img|hr|blockquote|pre|code)\b[^>]*>/i.test(body);
  }

  /**
   * Escape HTML entities for safe rendering of plain-text content.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format email body for HTML rendering.
   * - Pure plain text → escape and convert \n to <br>
   * - Pure HTML → normalize <p> styling
   * - Mixed content (HTML + trailing plain text) → normalize HTML and convert
   *   \n in text segments to <br>, but treat whitespace-only segments between
   *   tags as insignificant HTML formatting.
   */
  private formatEmailBody(body: string): string {
    if (!body) return '';

    if (!this.looksLikeHtml(body)) {
      // Plain text path: escape, then convert newlines.
      return this.escapeHtml(body).replace(/\n/g, '<br>');
    }

    // HTML path: normalize paragraph margins for Outlook/Gmail compatibility.
    let html = body
      // Inject inline margin on <p> tags so Outlook doesn't collapse them
      .replace(/<p(\s[^>]*)?>/gi, (_match, attrs) => {
        const a = attrs || '';
        if (/style\s*=/.test(a)) return `<p${a}>`;
        return `<p${a} style="margin: 0 0 12px 0;">`;
      })
      // Style empty paragraphs (Quill uses <p><br></p> for blank lines)
      .replace(/<p style="margin: 0 0 12px 0;"><br\s*\/?><\/p>/gi, '<p style="margin: 0 0 12px 0; min-height: 1em;">&nbsp;</p>')
      // Constrain inline images so they don't overflow on mobile / Outlook
      .replace(/<img(\s[^>]*)?>/gi, (_match, attrs) => {
        const a = attrs || '';
        if (/style\s*=/.test(a)) return `<img${a}>`;
        return `<img${a} style="max-width: 100%; height: auto; display: block; margin: 12px 0; border: 0;">`;
      });

    // Convert \n in text segments (mixed-content case). Split by tags so we
    // don't convert formatting whitespace between adjacent block elements.
    const parts = html.split(/(<[^>]+>)/g);
    return parts
      .map((part) => {
        if (!part) return part;
        if (part.startsWith('<')) return part; // tag — leave alone
        if (/^\s*$/.test(part)) return part.replace(/\n/g, ''); // whitespace-only between tags
        return part.replace(/\n/g, '<br>'); // real text content
      })
      .join('');
  }

  /**
   * Strip HTML tags for plain text fallback.
   * Preserves paragraph and list structure as line breaks.
   */
  private stripHtml(body: string): string {
    if (!this.looksLikeHtml(body)) return body;
    return body
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async testConnection(testEmailTo?: string): Promise<boolean> {
    try {
      // Force re-initialization to test current settings
      this.transporter = null;
      await this.initialize();

      if (!this.transporter) {
        throw new Error('Failed to initialize email service');
      }

      const transporter = this.transporter as Transporter<SMTPTransport.SentMessageInfo>;

      // Verify SMTP connection
      await transporter.verify();
      console.log('✓ SMTP connection successful');

      // If test email recipient provided, send test email
      if (testEmailTo) {
        const settings = await integrationRepository.getIntegrationSettings();
        const fromName = settings?.emailFromName || 'SwagSuite';

        await this.sendEmail({
          to: testEmailTo,
          subject: 'SwagSuite - Test Email',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${fromName}</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1f2937; margin-top: 0;">🎉 Test Email Successful!</h2>
                  <p style="color: #374151; line-height: 1.6;">
                    Congratulations! Your email configuration is working correctly.
                  </p>
                  <p style="color: #374151; line-height: 1.6;">
                    This is a test email sent from <strong>${fromName}</strong> to verify your SMTP settings.
                  </p>
                  <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #065f46; margin: 0; font-weight: 500;">✓ SMTP connection verified</p>
                    <p style="color: #059669; margin: 5px 0 0 0; font-size: 14px;">Email delivery is functioning properly</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    You can now send emails to your clients and vendors through SwagSuite.
                  </p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from ${fromName}</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `Test Email from ${fromName}\n\nCongratulations! Your email configuration is working correctly.\n\nThis is a test email sent to verify your SMTP settings.`,
        });
        console.log(`✓ Test email sent to ${testEmailTo}`);
      }

      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  }
}

export const emailService = new EmailService();
