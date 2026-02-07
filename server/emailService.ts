import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { storage } from './storage';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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

  async sendEmail(options: EmailOptions) {
    if (!this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const settings = await storage.getIntegrationSettings();
    const fromName = settings?.emailFromName || 'SwagSuite';
    const fromEmail = settings?.emailFromAddress || settings?.smtpUser || 'noreply@example.com';

    const info = await this.transporter.sendMail({
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

    // Use custom from/fromName if provided
    if (!this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    // Get settings for fallback
    const settings = await storage.getIntegrationSettings();
    const fromEmail = data.from || settings?.emailFromAddress || settings?.smtpUser || 'noreply@example.com';
    const fromName = data.fromName || settings?.emailFromName || 'SwagSuite';

    const mailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
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

    const info = await this.transporter.sendMail(mailOptions);

    console.log('✓ Email sent:', info.messageId);
    return { id: info.messageId, ...info };
  }

  async sendVendorEmail(data: {
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

    // Use custom from/fromName if provided
    if (!this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    // Get settings for fallback
    const settings = await storage.getIntegrationSettings();
    const fromEmail = data.from || settings?.emailFromAddress || settings?.smtpUser || 'noreply@example.com';
    const fromName = data.fromName || settings?.emailFromName || 'SwagSuite';

    const vendorMailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
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

    const info = await this.transporter.sendMail(vendorMailOptions);

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
