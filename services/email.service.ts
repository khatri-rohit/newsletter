// ==========================================
// EMAIL SERVICE - NODEMAILER INTEGRATION
// ==========================================

import nodemailer from "nodemailer";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const EmailConfigSchema = z.object({
  host: z.string().min(1, "GMAIL_HOST is required"),
  user: z.string().email("Valid GMAIL_USER is required"),
  password: z.string().min(1, "GMAIL_PASSWORD is required"),
});

// ==========================================
// EMAIL TEMPLATES
// ==========================================

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailTemplates {
  static welcomeEmail(name: string, email: string): EmailTemplate {
    return {
      subject: "🎉 Welcome to The Low Noise - Your Daily AI News Starts Now!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to The Low Noise</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 40px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: inline-block; position: relative; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; border: 2px solid #000; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold;">R</span>
                        </div>
                      </div>
                      <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #111827;">Welcome to The Low Noise</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${name || "there"},</p>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Thank you for signing up! You've just taken the first step toward staying ahead in the fast-moving world of AI. 🚀
                      </p>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Starting tomorrow, you'll receive our daily newsletter at <strong>7 AM</strong> with:
                      </p>
                      
                      <ul style="margin: 0 0 20px; padding-left: 20px; color: #374151;">
                        <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.6;">5-10 curated AI stories that actually matter</li>
                        <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.6;">Context and analysis, not just headlines</li>
                        <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.6;">Quick 5-minute reads to kickstart your day</li>
                      </ul>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 3px solid #000; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                          <strong style="color: #111827;">Your subscription details:</strong><br>
                          Email: ${email}<br>
                          Frequency: Daily at 7 AM<br>
                          First newsletter: Tomorrow
                        </p>
                      </div>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Questions or feedback? Just hit reply—we'd love to hear from you.
                      </p>
                      
                      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Cheers,<br>
                        <strong>The Low Noise Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                      <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                        © 2026 The Low Noise. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        You're receiving this because you signed up for The Low Noise newsletter.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Welcome to The Low Noise!

Hi ${name || "there"},

Thank you for signing up! You've just taken the first step toward staying ahead in the fast-moving world of AI.

Starting tomorrow, you'll receive our daily newsletter at 7 AM with:
- 5-10 curated AI stories that actually matter
- Context and analysis, not just headlines
- Quick 5-minute reads to kickstart your day

Your subscription details:
Email: ${email}
Frequency: Daily at 7 AM
First newsletter: Tomorrow

Questions or feedback? Just hit reply—we'd love to hear from you.

Cheers,
The Low Noise Team

© 2026 The Low Noise. All rights reserved.
      `,
    };
  }

  static reLoginEmail(name: string, email: string): EmailTemplate {
    return {
      subject: "👋 Welcome back to The Low Noise!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Back</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 40px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: inline-block; position: relative; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; border: 2px solid #000; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold;">R</span>
                        </div>
                      </div>
                      <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #111827;">Welcome Back!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${name || "there"},</p>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Great to see you again! You've successfully logged back into The Low Noise. 
                      </p>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        You're all set to continue receiving your daily AI news at <strong>7 AM</strong>. We've been busy curating the latest developments in AI, and we can't wait to share them with you.
                      </p>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 3px solid #000; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                          <strong style="color: #111827;">Your account:</strong><br>
                          Email: ${email}<br>
                          Status: Active<br>
                          Newsletter: Daily at 7 AM
                        </p>
                      </div>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Need help with something? Have feedback? Just hit reply—we're here to help.
                      </p>
                      
                      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Cheers,<br>
                        <strong>The Low Noise Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                      <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                        © 2026 The Low Noise. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        This email was sent because you logged into your account.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Welcome Back!

Hi ${name || "there"},

Great to see you again! You've successfully logged back into The Low Noise.

You're all set to continue receiving your daily AI news at 7 AM. We've been busy curating the latest developments in AI, and we can't wait to share them with you.

Your account:
Email: ${email}
Status: Active
Newsletter: Daily at 7 AM

Need help with something? Have feedback? Just hit reply—we're here to help.

Cheers,
The Low Noise Team

© 2026 The Low Noise. All rights reserved.
      `,
    };
  }
}

// ==========================================
// EMAIL SERVICE CLASS
// ==========================================

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: z.infer<typeof EmailConfigSchema>;

  constructor() {
    this.config = this.validateConfig();
    this.initializeTransporter();
  }

  private validateConfig() {
    try {
      return EmailConfigSchema.parse({
        host: process.env.GMAIL_HOST,
        user: process.env.GMAIL_USER,
        password: process.env.GMAIL_PASSWORD,
      });
    } catch (error) {
      const err = error as Error;
      throw new Error(`Invalid email configuration: ${err.message}`);
    }
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: 587,
        secure: false, // Use TLS
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error) => {
        if (error) {
          console.error("Email service configuration error:", error);
        } else {
          console.log("Email service ready to send messages");
        }
      });
    } catch (error) {
      console.error("Failed to initialize email transporter:", error);
      throw error;
    }
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.transporter) {
      throw new Error("Email transporter not initialized");
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"The Low Noise" <${this.config.user}>`,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    const template = EmailTemplates.welcomeEmail(name, email);
    return this.sendEmail(email, template);
  }

  async sendReLoginEmail(name: string, email: string): Promise<boolean> {
    const template = EmailTemplates.reLoginEmail(name, email);
    return this.sendEmail(email, template);
  }

  // Send newsletter to all subscribers
  async sendNewsletterBatch(
    subscribers: Array<{ email: string; name?: string }>,
    subject: string,
    htmlContent: string,
    textContent: string,
  ): Promise<{ success: number; failed: number }> {
    if (!this.transporter) {
      throw new Error("Email transporter not initialized");
    }

    let success = 0;
    let failed = 0;

    // Send in batches of 50 to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const promises = batch.map(async (subscriber) => {
        try {
          await this.transporter!.sendMail({
            from: `"The Low Noise" <${this.config.user}>`,
            to: subscriber.email,
            subject,
            text: textContent,
            html: htmlContent,
          });
          success++;
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
