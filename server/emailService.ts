import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { storage } from './storage';

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
    const settings = await storage.getIntegrationSettings();

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
    const userSettings = await storage.getUserEmailSettings(userId);

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
      const userSettings = await storage.getUserEmailSettings(userId);
      console.log(`📧 getTransporterForUser: userId=${userId}, hasUserSettings=${!!userSettings}, useDefault=${userSettings?.useDefaultForCompose}`);

      if (userSettings && !userSettings.useDefaultForCompose) {
        const userTransporter = await this.createUserTransporter(userId);
        if (userTransporter) {
          const user = await storage.getUser(userId);
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

    const settings = await storage.getIntegrationSettings();
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
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #2563eb; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SwagSuite</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">${data.subject}</h2>
            ${data.orderNumber || data.companyName ? `
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                ${data.orderNumber ? `<p style="margin: 5px 0;"><strong>Order #:</strong> ${data.orderNumber}</p>` : ''}
                ${data.companyName ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${data.companyName}</p>` : ''}
              </div>
            ` : ''}
            <div style="color: #374151; line-height: 1.6; font-size: 14px;">
              ${data.body.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { transporter, fromEmail: defaultFrom, fromName: defaultFromName } =
      await this.getTransporterForUser(data.userId);

    // Always use the transporter's authenticated email as FROM address
    // SMTP servers reject sending from domains that don't match the authenticated account
    const fromEmail = defaultFrom;
    const fromName = data.fromName || defaultFromName;

    const mailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: data.from || fromEmail,
      to: data.to,
      toName: data.toName,
      subject: data.subject,
      html,
      text: data.body,
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
      const { replitStorage } = await import('./replitStorage');
      mailOptions.attachments = await Promise.all(
        data.attachments.map(async (att) => {
          const buffer = await replitStorage.downloadFile(att.storagePath);
          return {
            filename: att.originalFilename,
            content: buffer,
            contentType: att.mimeType,
          };
        })
      );
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
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #059669; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SwagSuite</h1>
            <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 14px;">Vendor Communication</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">${data.subject}</h2>
            ${data.orderNumber || data.supplierName ? `
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                ${data.orderNumber ? `<p style="margin: 5px 0;"><strong>PO #:</strong> ${data.orderNumber}</p>` : ''}
                ${data.supplierName ? `<p style="margin: 5px 0;"><strong>Vendor:</strong> ${data.supplierName}</p>` : ''}
              </div>
            ` : ''}
            <div style="color: #374151; line-height: 1.6; font-size: 14px;">
              ${data.body.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { transporter, fromEmail: defaultFrom, fromName: defaultFromName } =
      await this.getTransporterForUser(data.userId);

    // Always use the transporter's authenticated email as FROM address
    const fromEmail = defaultFrom;
    const fromName = data.fromName || defaultFromName;

    const vendorMailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: data.from || fromEmail,
      to: data.to,
      toName: data.toName,
      subject: data.subject,
      html,
      text: data.body,
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
      const { replitStorage } = await import('./replitStorage');
      vendorMailOptions.attachments = await Promise.all(
        data.attachments.map(async (att) => {
          const buffer = await replitStorage.downloadFile(att.storagePath);
          return {
            filename: att.originalFilename,
            content: buffer,
            contentType: att.mimeType,
          };
        })
      );
    }

    const info = await transporter.sendMail(vendorMailOptions);

    console.log('✓ Email sent:', info.messageId);
    return { id: info.messageId, ...info };
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
        const settings = await storage.getIntegrationSettings();
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
      console.error('❌ SMTP connection failed:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
