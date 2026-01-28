// ==========================================
// EMAIL SERVICE - NODEMAILER INTEGRATION
// ==========================================

import nodemailer from 'nodemailer';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const EmailConfigSchema = z.object({
  host: z.string().min(1, 'GMAIL_HOST is required'),
  user: z.string().email('Valid GMAIL_USER is required'),
  password: z.string().min(1, 'GMAIL_PASSWORD is required'),
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
      subject: 'Welcome to The Low Noise ⚡',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to The Low Noise</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Space Mono', 'Courier New', monospace; background: linear-gradient(165deg, #000 0%, #1a1a1a 50%, #000 100%);">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 60px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 680px; background: #0a0a0a; border: 1px solid #00ff41; box-shadow: 0 0 40px rgba(0, 255, 65, 0.15), inset 0 0 60px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Terminal header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%); border-bottom: 1px solid #00ff41;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 10px rgba(0, 255, 65, 0.8); margin-right: 8px;"></span>
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ffff00; border-radius: 50%; opacity: 0.3; margin-right: 8px;"></span>
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ff4444; border-radius: 50%; opacity: 0.3;"></span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #00ff41; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
<span style="color: #666;">$</span> ./connect_subscriber.sh --user="${name || 'there'}"
<span style="color: #00ff41; text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONNECTION ESTABLISHED
  WELCOME TO THE LOW NOISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                            </pre>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Welcome badge -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <div style="margin-top: -15px;">
                        <span style="display: inline-block; padding: 6px 16px; background: #00ff41; color: #000; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'JetBrains Mono', monospace; box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);">
                          &gt;&gt; SYSTEM_INITIALIZED
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 35px 40px; background: #0a0a0a;">
                      <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #e0e0e0; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;">
<span style="color: #00ff41;">&gt; HELLO ${name || 'THERE'},</span>

Welcome to the signal. You just leveled up your AI 
news game. No more drowning in headlines. No more 
clickbait. Just pure, curated intelligence.

<span style="color: #666;">// WHAT YOU'LL RECEIVE:</span>

<span style="color: #00ff41;">├─</span> 5-10 handpicked AI stories daily
<span style="color: #00ff41;">├─</span> Context and analysis, not just headlines  
<span style="color: #00ff41;">├─</span> 5-minute reads that actually matter
<span style="color: #00ff41;">└─</span> Delivered at 0900 hours sharp

<span style="color: #666;">// SUBSCRIPTION DETAILS:</span>

<div style="padding: 20px; background: rgba(0, 255, 65, 0.05); border-left: 3px solid #00ff41; margin: 15px 0;">
<span style="color: #00ff41;">EMAIL:</span>      ${email}
<span style="color: #00ff41;">FREQUENCY:</span>  Daily at 07:00
<span style="color: #00ff41;">FIRST_DROP:</span> Tomorrow morning
<span style="color: #00ff41;">STATUS:</span>     <span style="color: #00ff41; font-weight: 700;">ACTIVE</span>
</div>

Questions? Feedback? Just hit reply. There's a 
real human on the other end (no AI chatbot BS).

<span style="color: #666;">// SIGNING OFF</span>

Stay sharp,
<span style="color: #00ff41; font-weight: 700;">Rohit Khatri</span>
Curator, The Low Noise
                      </pre>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 35px 40px; text-align: center; background: #000; border-top: 1px solid #00ff41;">
                      <pre style="margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00ff41; line-height: 1.4; opacity: 0.7;">
 _____ _  _ ___   _    _____      __ 
|_   _| || | __| | |  / _ \\\\ \\\\    / / 
  | | | __ | _|  | |_| (_) \\\\ \\\\/\\\\/ /  
  |_| |_||_|___| |____\\___/ \\\\_/\\\\_/   
                                      
    _  _  ___ ___ ___ ___             
   | \\\\| |/ _ \\\\_ _/ __| __|            
   | .  | (_) | |\\__ \\\\ _|             
   |_|\\\\_|\\___/___|___/___|            
                      </pre>
                      <div style="margin-bottom: 20px;">
                        <a href="${baseUrl}" style="color: #00ff41; text-decoration: none; margin: 0 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;">[ SITE ]</a>
                        <span style="color: #333;">|</span>
                        <a href="${baseUrl}/api/user/subscription?action=unsubscribe" style="color: #888; text-decoration: none; margin: 0 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;">[ UNSUBSCRIBE ]</a>
                      </div>
                      <p style="margin: 0; font-size: 10px; color: #444; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;">
                        © 2026 THE LOW NOISE // ALL TRANSMISSIONS SECURED
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONNECTION ESTABLISHED
  WELCOME TO THE LOW NOISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

>> SYSTEM_INITIALIZED

> HELLO ${name || 'THERE'},

Welcome to the signal. You just leveled up your AI news game. 
No more drowning in headlines. No more clickbait. 
Just pure, curated intelligence.

// WHAT YOU'LL RECEIVE:

├─ 5-10 handpicked AI stories daily
├─ Context and analysis, not just headlines  
├─ 5-minute reads that actually matter
└─ Delivered at 0900 hours sharp

// SUBSCRIPTION DETAILS:

EMAIL:      ${email}
FREQUENCY:  Daily at 07:00
FIRST_DROP: Tomorrow morning
STATUS:     ACTIVE

Questions? Feedback? Just hit reply. There's a real human on 
the other end (no AI chatbot BS).

// SIGNING OFF

Stay sharp,
Rohit Khatri
Curator, The Low Noise

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE LOW NOISE

Links:
Site: ${baseUrl}
Unsubscribe: ${baseUrl}/api/user/subscription?action=unsubscribe

© 2026 THE LOW NOISE // ALL TRANSMISSIONS SECURED
      `,
    };
  }

  static reLoginEmail(name: string, email: string): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
      subject: 'Welcome Back to The Low Noise ⚡',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Back</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Space Mono', 'Courier New', monospace; background: linear-gradient(165deg, #000 0%, #1a1a1a 50%, #000 100%);">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 60px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 680px; background: #0a0a0a; border: 1px solid #00ff41; box-shadow: 0 0 40px rgba(0, 255, 65, 0.15), inset 0 0 60px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Terminal header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%); border-bottom: 1px solid #00ff41;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 10px rgba(0, 255, 65, 0.8); margin-right: 8px;"></span>
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ffff00; border-radius: 50%; opacity: 0.3; margin-right: 8px;"></span>
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ff4444; border-radius: 50%; opacity: 0.3;"></span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #00ff41; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
<span style="color: #666;">$</span> ./reconnect.sh --user="${name || 'there'}"
<span style="color: #00ff41; text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SECURE CONNECTION RE-ESTABLISHED
  WELCOME BACK TO THE SIGNAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                            </pre>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Status badge -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <div style="margin-top: -15px;">
                        <span style="display: inline-block; padding: 6px 16px; background: #00ff41; color: #000; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'JetBrains Mono', monospace; box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);">
                          &gt;&gt; AUTH_SUCCESSFUL
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 35px 40px; background: #0a0a0a;">
                      <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #e0e0e0; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;">
<span style="color: #00ff41;">&gt; WELCOME BACK, ${name || 'FRIEND'}.</span>

Good to see you again. Your session is restored 
and everything's exactly where you left it.

Daily AI intelligence drops continue at 0900 hours. 
We've been busy curating the signal while you were 
away. Fresh insights incoming.

<span style="color: #666;">// ACCOUNT STATUS:</span>

<div style="padding: 20px; background: rgba(0, 255, 65, 0.05); border-left: 3px solid #00ff41; margin: 15px 0;">
<span style="color: #00ff41;">EMAIL:</span>       ${email}
<span style="color: #00ff41;">STATUS:</span>      <span style="color: #00ff41; font-weight: 700;">ACTIVE</span>
<span style="color: #00ff41;">DELIVERY:</span>    Daily at 07:00
<span style="color: #00ff41;">NEXT_DROP:</span>   Tomorrow morning
</div>

Need anything? Hit reply. We're here.

<span style="color: #666;">// BACK TO WORK</span>

Keep cutting through the noise,
<span style="color: #00ff41; font-weight: 700;">Rohit Khatri</span>
Curator, The Low Noise
                      </pre>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 35px 40px; text-align: center; background: #000; border-top: 1px solid #00ff41;">
                      <pre style="margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00ff41; line-height: 1.4; opacity: 0.7;">
 _____ _  _ ___   _    _____      __ 
|_   _| || | __| | |  / _ \\\\ \\\\    / / 
  | | | __ | _|  | |_| (_) \\\\ \\\\/\\\\/ /  
  |_| |_||_|___| |____\\___/ \\\\_/\\\\_/   
                                      
    _  _  ___ ___ ___ ___             
   | \\\\| |/ _ \\\\_ _/ __| __|            
   | .  | (_) | |\\__ \\\\ _|             
   |_|\\\\_|\\___/___|___/___|            
                      </pre>
                      <div style="margin-bottom: 20px;">
                        <a href="${baseUrl}" style="color: #00ff41; text-decoration: none; margin: 0 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;">[ SITE ]</a>
                        <span style="color: #333;">|</span>
                      </div>
                      <p style="margin: 0; font-size: 10px; color: #444; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;">
                        © 2026 THE LOW NOISE // ALL TRANSMISSIONS SECURED
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SECURE CONNECTION RE-ESTABLISHED
  WELCOME BACK TO THE SIGNAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

>> AUTH_SUCCESSFUL

> WELCOME BACK, ${name || 'FRIEND'}.

Good to see you again. Your session is restored and everything's 
exactly where you left it.

Daily AI intelligence drops continue at 0900 hours. We've been 
busy curating the signal while you were away. Fresh insights incoming.

// ACCOUNT STATUS:

EMAIL:       ${email}
STATUS:      ACTIVE
DELIVERY:    Daily at 07:00
NEXT_DROP:   Tomorrow morning

Need anything? Hit reply. We're here.

// BACK TO WORK

Keep cutting through the noise,
Rohit Khatri
Curator, The Low Noise

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE LOW NOISE

Links:
Site: ${baseUrl}

© 2026 THE LOW NOISE // ALL TRANSMISSIONS SECURED
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
          console.error('Email service configuration error:', error);
        } else {
          console.log('Email service ready to send messages');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"The Low Noise" <${this.config.user}>`,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
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
    textContent: string
  ): Promise<{ success: number; failed: number }> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
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
