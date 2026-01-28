// ==========================================
// EMAIL QUEUE SERVICE - ENTERPRISE GRADE
// ==========================================

import { getEmailService } from './email.service';
import { getUserService } from './user.service';
import { Newsletter } from './types';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface EmailQueueItem {
  id: string;
  recipient: {
    email: string;
    name?: string;
    userId?: string;
  };
  newsletterId: string;
  newsletterTitle: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'bounced';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface EmailQueueStats {
  total: number;
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  bounced: number;
  successRate: number;
}

export interface SendNewsletterOptions {
  batchSize?: number; // Number of emails to process in parallel (default: 1)
  delayBetweenEmails?: number; // Delay in ms between emails (default: 10000)
  maxRetries?: number; // Max retry attempts per email (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 60000)
  onProgress?: (stats: EmailQueueStats) => void;
  onComplete?: (stats: EmailQueueStats) => void;
  onError?: (error: Error, item: EmailQueueItem) => void;
}

// ==========================================
// EMAIL QUEUE SERVICE CLASS
// ==========================================

export class EmailQueueService {
  private queue: EmailQueueItem[] = [];
  private processing = false;
  private emailService = getEmailService();
  private userService = getUserService();

  constructor() {
    console.log('[EmailQueueService] Initialized');
  }

  /**
   * Generate unique ID for queue items
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add email to queue
   */
  private addToQueue(
    item: Omit<EmailQueueItem, 'id' | 'createdAt' | 'status' | 'attempts'>
  ): string {
    const queueItem: EmailQueueItem = {
      ...item,
      id: this.generateId(),
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.push(queueItem);
    console.log(`[EmailQueue] Added ${queueItem.recipient.email} to queue (ID: ${queueItem.id})`);
    return queueItem.id;
  }

  /**
   * Get queue statistics
   */
  getStats(): EmailQueueStats {
    const total = this.queue.length;
    const pending = this.queue.filter((item) => item.status === 'pending').length;
    const sending = this.queue.filter((item) => item.status === 'sending').length;
    const sent = this.queue.filter((item) => item.status === 'sent').length;
    const failed = this.queue.filter((item) => item.status === 'failed').length;
    const bounced = this.queue.filter((item) => item.status === 'bounced').length;
    const successRate = total > 0 ? (sent / total) * 100 : 0;

    return {
      total,
      pending,
      sending,
      sent,
      failed,
      bounced,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Clear completed items from queue
   */
  clearCompleted(): void {
    const before = this.queue.length;
    this.queue = this.queue.filter(
      (item) => item.status === 'pending' || item.status === 'sending'
    );
    const removed = before - this.queue.length;
    console.log(`[EmailQueue] Cleared ${removed} completed items from queue`);
  }

  /**
   * Send single email with retry logic
   */
  private async sendEmailWithRetry(
    item: EmailQueueItem,
    options: SendNewsletterOptions
  ): Promise<boolean> {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 60000;

    while (item.attempts < maxRetries) {
      try {
        item.status = 'sending';
        item.attempts++;
        item.lastAttemptAt = new Date();

        console.log(
          `[EmailQueue] Sending to ${item.recipient.email} (Attempt ${item.attempts}/${maxRetries})`
        );

        // Send email
        await this.emailService.sendEmail(item.recipient.email, {
          subject: item.subject,
          html: item.htmlContent,
          text: item.textContent,
        });

        // Mark as sent
        item.status = 'sent';
        item.sentAt = new Date();

        console.log(`[EmailQueue] ✓ Successfully sent to ${item.recipient.email}`);

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        item.error = errorMessage;

        console.error(
          `[EmailQueue] ✗ Failed to send to ${item.recipient.email} (Attempt ${item.attempts}/${maxRetries}):`,
          errorMessage
        );

        // Check if it's a permanent failure (bounce)
        if (
          errorMessage.includes('bounce') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('not exist')
        ) {
          item.status = 'bounced';
          await this.handleBounce(item.recipient.email);
          console.log(`[EmailQueue] Marked ${item.recipient.email} as bounced`);
          return false;
        }

        // If max retries reached, mark as failed
        if (item.attempts >= maxRetries) {
          item.status = 'failed';
          console.log(
            `[EmailQueue] Max retries reached for ${item.recipient.email}, marked as failed`
          );

          if (options.onError) {
            options.onError(error as Error, item);
          }

          return false;
        }

        // Wait before retry
        console.log(`[EmailQueue] Waiting ${retryDelay}ms before retry...`);
        await this.delay(retryDelay);
      }
    }

    return false;
  }

  /**
   * Handle bounced email - update subscriber status
   */
  private async handleBounce(email: string): Promise<void> {
    try {
      await this.userService.updateSubscriberStatus(email, 'bounced');
    } catch (error) {
      console.error(`[EmailQueue] Failed to update bounce status for ${email}:`, error);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Process the email queue
   */
  private async processQueue(options: SendNewsletterOptions): Promise<void> {
    if (this.processing) {
      console.log('[EmailQueue] Queue is already being processed');
      return;
    }

    this.processing = true;
    const delayBetweenEmails = options.delayBetweenEmails || 10000;
    const batchSize = options.batchSize || 1;

    console.log('[EmailQueue] Starting queue processing...');
    console.log(
      `[EmailQueue] Configuration: ${batchSize} parallel emails, ${delayBetweenEmails}ms delay`
    );

    try {
      const pendingItems = this.queue.filter((item) => item.status === 'pending');

      // Process in batches
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);

        // Send batch in parallel
        await Promise.all(batch.map((item) => this.sendEmailWithRetry(item, options)));

        // Update progress
        if (options.onProgress) {
          options.onProgress(this.getStats());
        }

        // Delay between batches (except for last batch)
        if (i + batchSize < pendingItems.length) {
          console.log(`[EmailQueue] Waiting ${delayBetweenEmails}ms before next batch...`);
          await this.delay(delayBetweenEmails);
        }
      }

      const stats = this.getStats();
      console.log('[EmailQueue] Processing complete');
      console.log(`[EmailQueue] Stats:`, stats);

      if (options.onComplete) {
        options.onComplete(stats);
      }
    } catch (error) {
      console.error('[EmailQueue] Fatal error during processing:', error);
      throw error;
    } finally {
      this.processing = false;
    }
  }

  /**
   * Send newsletter to all active subscribers
   * This is the main entry point for sending newsletter notifications
   */
  async sendNewsletterToSubscribers(
    newsletter: Newsletter,
    options: SendNewsletterOptions = {}
  ): Promise<EmailQueueStats> {
    try {
      console.log(`[EmailQueue] Preparing to send newsletter: ${newsletter.title}`);

      // Get all active subscribers
      const subscribers = await this.userService.getAllActiveSubscribers();

      if (subscribers.length === 0) {
        console.log('[EmailQueue] No active subscribers found');
        return this.getStats();
      }

      console.log(`[EmailQueue] Found ${subscribers.length} active subscribers`);

      // Add all subscribers to queue with personalized content
      const maxRetries = options.maxRetries || 3;
      for (const subscriber of subscribers) {
        // Generate personalized email content for each recipient (for unsubscribe link)
        const { subject, htmlContent, textContent } = await this.generateNewsletterEmail(
          newsletter,
          subscriber.email
        );

        this.addToQueue({
          recipient: {
            email: subscriber.email,
            name: subscriber.name,
            userId: subscriber.userId,
          },
          newsletterId: newsletter.id!,
          newsletterTitle: newsletter.title,
          subject,
          htmlContent,
          textContent,
          maxAttempts: maxRetries,
        });
      }

      console.log(`[EmailQueue] Queued ${subscribers.length} emails for sending`);

      // Process the queue
      await this.processQueue(options);

      return this.getStats();
    } catch (error) {
      console.error('[EmailQueue] Error sending newsletter:', error);
      throw error;
    }
  }

  /**
   * Format date from various types
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatDate(date: any): string {
    try {
      if (!date) {
        return new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      // Check if it's a Firestore Timestamp
      if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        return date
          .toDate()
          .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (date instanceof Date) {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      return new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  /**
   * Generate newsletter email content
   */
  private async generateNewsletterEmail(
    newsletter: Newsletter,
    recipientEmail?: string
  ): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    const subject = `� ${newsletter.title}`;

    // Extract plain text preview from HTML content (first 200 chars)
    const textPreview =
      newsletter.excerpt || this.extractTextFromHtml(newsletter.content).substring(0, 200);

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const newsletterUrl = `${baseUrl}/p/${newsletter.slug}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${newsletter.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Space Mono', 'Courier New', monospace; background: linear-gradient(165deg, #000 0%, #1a1a1a 50%, #000 100%);">
        <!-- Noise texture overlay -->
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.03; pointer-events: none; background-image: url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E');"></div>
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 60px 20px;">
          <tr>
            <td align="center">
              <!-- Main content container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 680px; background: #0a0a0a; border: 1px solid #00ff41; position: relative; box-shadow: 0 0 40px rgba(0, 255, 65, 0.15), inset 0 0 60px rgba(0, 0, 0, 0.5);">
                
                <!-- Glowing corner accents -->
                <tr>
                  <td>
                    <div style="position: absolute; top: -2px; left: -2px; width: 40px; height: 40px; border-top: 3px solid #00ff41; border-left: 3px solid #00ff41; box-shadow: 0 0 15px rgba(0, 255, 65, 0.7);"></div>
                    <div style="position: absolute; top: -2px; right: -2px; width: 40px; height: 40px; border-top: 3px solid #00ff41; border-right: 3px solid #00ff41; box-shadow: 0 0 15px rgba(0, 255, 65, 0.7);"></div>
                    <div style="position: absolute; bottom: -2px; left: -2px; width: 40px; height: 40px; border-bottom: 3px solid #00ff41; border-left: 3px solid #00ff41; box-shadow: 0 0 15px rgba(0, 255, 65, 0.7);"></div>
                    <div style="position: absolute; bottom: -2px; right: -2px; width: 40px; height: 40px; border-bottom: 3px solid #00ff41; border-right: 3px solid #00ff41; box-shadow: 0 0 15px rgba(0, 255, 65, 0.7);"></div>
                  </td>
                </tr>
                
                <!-- Terminal-style header -->
                <tr>
                  <td style="padding: 40px 40px 20px; background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%); border-bottom: 1px solid #00ff41;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 10px rgba(0, 255, 65, 0.8);"></span>
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ffff00; border-radius: 50%; opacity: 0.3;"></span>
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ff4444; border-radius: 50%; opacity: 0.3;"></span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #00ff41; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
<span style="color: #666;">$</span> cat ~/newsletters/latest.md
<span style="color: #00ff41; text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THE LOW NOISE /// SIGNAL DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                          </pre>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Newsletter badge -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="margin-top: -15px; text-align: left;">
                      <span style="display: inline-block; padding: 6px 16px; background: #00ff41; color: #000; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'JetBrains Mono', monospace; box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);">
                        &gt;&gt; NEW_TRANSMISSION
                      </span>
                    </div>
                  </td>
                </tr>
                
                <!-- Title section -->
                <tr>
                  <td style="padding: 35px 40px 25px; background: #0a0a0a;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2; font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: -0.5px; text-shadow: 0 0 20px rgba(0, 255, 65, 0.3);">
                      ${newsletter.title}
                    </h1>
                  </td>
                </tr>
                
                <!-- Metadata in terminal style -->
                <tr>
                  <td style="padding: 0 40px 25px; background: #0a0a0a;">
                    <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #00ff41; line-height: 1.8;">
<span style="color: #666;">METADATA:</span>
├─ date: <span style="color: #fff;">${this.formatDate(newsletter.publishedAt)}</span>${
      newsletter.metadata?.readTime
        ? `
├─ read_time: <span style="color: #fff;">${newsletter.metadata.readTime} minutes</span>`
        : ''
    }
└─ author: <span style="color: #fff;">${newsletter.authorName}</span>
                    </pre>
                  </td>
                </tr>
                
                <!-- Thumbnail with scanline effect -->
                ${
                  newsletter.thumbnail
                    ? `
                <tr>
                  <td style="padding: 0 40px 30px; background: #0a0a0a;">
                    <div style="position: relative; overflow: hidden; border: 2px solid #00ff41; box-shadow: 0 0 30px rgba(0, 255, 65, 0.2);">
                      <img src="${newsletter.thumbnail}" alt="${newsletter.title}" style="width: 100%; height: auto; display: block; filter: contrast(1.1) brightness(0.95);" />
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.03) 0px, transparent 2px, transparent 4px); pointer-events: none;"></div>
                    </div>
                  </td>
                </tr>
                `
                    : ''
                }
                
                <!-- Content preview with matrix style -->
                <tr>
                  <td style="padding: 0 40px 35px; background: #0a0a0a;">
                    <div style="padding: 25px; background: rgba(0, 255, 65, 0.05); border-left: 4px solid #00ff41; border-right: 1px solid rgba(0, 255, 65, 0.2); position: relative; overflow: hidden;">
                      <div style="position: absolute; top: 0; right: 0; width: 100%; height: 100%; background: repeating-linear-gradient(90deg, transparent 0px, rgba(0, 255, 65, 0.02) 1px, transparent 2px); pointer-events: none;"></div>
                      <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 14px; line-height: 1.7; color: #e0e0e0; white-space: pre-wrap; word-wrap: break-word; position: relative;">
<span style="color: #666;">PREVIEW:</span>

${textPreview}...

<span style="color: #00ff41; animation: blink 1s infinite;">[CONTINUE_READING]</span>
                      </pre>
                    </div>
                  </td>
                </tr>
                
                <!-- CTA button with terminal style -->
                <tr>
                  <td style="padding: 0 40px 45px; text-align: center; background: #0a0a0a;">
                    <a href="${newsletterUrl}" style="display: inline-block; padding: 18px 45px; background: #00ff41; color: #000; text-decoration: none; font-size: 15px; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 30px rgba(0, 255, 65, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.2); transition: all 0.3s ease; border: 2px solid #000;">
                      &gt;&gt; ACCESS FULL TRANSMISSION
                    </a>
                    <div style="margin-top: 15px;">
                      <span style="font-size: 11px; color: #666; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;">
                        [ CLICK TO DECRYPT CONTENT ]
                      </span>
                    </div>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px; background: #0a0a0a;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #00ff41 50%, transparent 100%); box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);"></div>
                  </td>
                </tr>
                
                <!-- Info section -->
                <tr>
                  <td style="padding: 35px 40px; background: #0a0a0a;">
                    <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #888; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;">
<span style="color: #00ff41;">WHY_THIS_MESSAGE:</span>
You subscribed to THE LOW NOISE for daily AI 
intelligence. We filter signal from noise and 
deliver at 0900 hours sharp.

<span style="color: #00ff41;">NEED_HELP:</span>
Reply to this transmission. Human on the other end.
                    </pre>
                  </td>
                </tr>
                
                <!-- Footer with ASCII art -->
                <tr>
                  <td style="padding: 35px 40px; text-align: center; background: #000; border-top: 1px solid #00ff41;">
                    <pre style="margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00ff41; line-height: 1.4; opacity: 0.7;">
 _____ _  _ ___   _    _____      __ 
|_   _| || | __| | |  / _ \\ \\    / / 
  | | | __ | _|  | |_| (_) \\ \\/\\/ /  
  |_| |_||_|___| |____\\___/ \\_/\\_/   
                                      
    _  _  ___ ___ ___ ___             
   | \\| |/ _ \\_ _/ __| __|            
   | .  | (_) | |\\__ \\ _|             
   |_|\\_|\\___/___|___/___|            
                    </pre>
                    <div style="margin-bottom: 20px;">
                      <a href="${baseUrl}" style="color: #00ff41; text-decoration: none; margin: 0 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;">[ SITE ]</a>
                      <span style="color: #333;">|</span>
                      <a href="${baseUrl}/api/user/subscription?action=unsubscribe&email=${encodeURIComponent(recipientEmail || '')}" style="color: #888; text-decoration: none; margin: 0 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;">[ UNSUBSCRIBE ]</a>
                      <span style="color: #333;">|</span>
                      <a href="${baseUrl}/api/user/subscription?action=preferences" style="color: #888; text-decoration: none; margin: 0 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;">[ SETTINGS ]</a>
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
    `;

    const textContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THE LOW NOISE /// SIGNAL DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

>> NEW_TRANSMISSION

${newsletter.title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METADATA:
├─ date: ${this.formatDate(newsletter.publishedAt)}${
      newsletter.metadata?.readTime
        ? `
├─ read_time: ${newsletter.metadata.readTime} minutes`
        : ''
    }
└─ author: ${newsletter.authorName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PREVIEW:

${textPreview}...

[CONTINUE_READING]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

>> ACCESS FULL TRANSMISSION:
${newsletterUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY_THIS_MESSAGE:
You subscribed to THE LOW NOISE for daily AI intelligence. 
We filter signal from noise and deliver at 0900 hours sharp.

NEED_HELP:
Reply to this transmission. Human on the other end.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE LOW NOISE
Curated AI news without the noise

LINKS:
Site: ${baseUrl}
Unsubscribe: ${baseUrl}/api/user/subscription?action=unsubscribe&email=${encodeURIComponent(recipientEmail || '')}

© 2026 THE LOW NOISE // ALL TRANSMISSIONS SECURED
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Extract plain text from HTML content
   */
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get current queue (for monitoring)
   */
  getQueue(): EmailQueueItem[] {
    return [...this.queue];
  }

  /**
   * Check if processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Clear entire queue
   */
  clearQueue(): void {
    this.queue = [];
    console.log('[EmailQueue] Queue cleared');
  }
}

// Singleton instance
let emailQueueServiceInstance: EmailQueueService | null = null;

export function getEmailQueueService(): EmailQueueService {
  if (!emailQueueServiceInstance) {
    emailQueueServiceInstance = new EmailQueueService();
  }
  return emailQueueServiceInstance;
}
