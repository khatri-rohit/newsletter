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

      // Generate email content
      const { subject, htmlContent, textContent } = await this.generateNewsletterEmail(newsletter);

      // Add all subscribers to queue
      const maxRetries = options.maxRetries || 3;
      for (const subscriber of subscribers) {
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
  private async generateNewsletterEmail(newsletter: Newsletter): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    const subject = `📰 ${newsletter.title} - The Low Noise`;

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
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <img src="${baseUrl}/lownoise.png" alt="The Low Noise" style="width: 120px; height: auto; margin-bottom: 16px;" />
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">The Low Noise</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #e0e7ff; font-weight: 300;">Your Daily AI Intelligence</p>
                  </td>
                </tr>
                
                <!-- Newsletter Badge -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="margin-top: -20px; text-align: center;">
                      <span style="display: inline-block; padding: 8px 20px; background-color: #10b981; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        🆕 New Newsletter
                      </span>
                    </div>
                  </td>
                </tr>
                
                <!-- Newsletter Title -->
                <tr>
                  <td style="padding: 30px 40px 20px;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; line-height: 1.3;">
                      ${newsletter.title}
                    </h2>
                  </td>
                </tr>
                
                <!-- Metadata -->
                <tr>
                  <td style="padding: 0 40px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right: 20px;">
                          <span style="font-size: 13px; color: #6b7280;">
                            📅 ${this.formatDate(newsletter.publishedAt)}
                          </span>
                        </td>
                        ${
                          newsletter.metadata?.readTime
                            ? `
                        <td style="padding-right: 20px;">
                          <span style="font-size: 13px; color: #6b7280;">
                            ⏱️ ${newsletter.metadata.readTime} min read
                          </span>
                        </td>
                        `
                            : ''
                        }
                        <td>
                          <span style="font-size: 13px; color: #6b7280;">
                            ✍️ ${newsletter.authorName}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Thumbnail (if exists) -->
                ${
                  newsletter.thumbnail
                    ? `
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <img src="${newsletter.thumbnail}" alt="${newsletter.title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
                  </td>
                </tr>
                `
                    : ''
                }
                
                <!-- Preview/Excerpt -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <div style="padding: 24px; background-color: #f9fafb; border-left: 4px solid #667eea; border-radius: 6px;">
                      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151; font-style: italic;">
                        ${textPreview}...
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <a href="${newsletterUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                      Read Full Newsletter →
                    </a>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #e5e7eb;"></div>
                  </td>
                </tr>
                
                <!-- Additional Content -->
                <tr>
                  <td style="padding: 30px 40px;">
                    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      <strong style="color: #111827;">Why you're receiving this:</strong><br/>
                      You're subscribed to The Low Noise newsletter. We handpick the most important AI news and deliver it to your inbox daily at 7 AM.
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      Stay informed, stay ahead. Questions or feedback? Just hit reply.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                      <strong style="color: #111827;">The Low Noise</strong>
                    </p>
                    <p style="margin: 0 0 16px; font-size: 12px; color: #9ca3af;">
                      Curated AI news without the noise
                    </p>
                    <p style="margin: 0 0 12px; font-size: 12px;">
                      <a href="${baseUrl}" style="color: #667eea; text-decoration: none; margin: 0 8px;">Visit Website</a>
                      <span style="color: #d1d5db;">•</span>
                      <a href="${baseUrl}/api/user/subscription?action=unsubscribe" style="color: #6b7280; text-decoration: none; margin: 0 8px;">Unsubscribe</a>
                      <span style="color: #d1d5db;">•</span>
                      <a href="${baseUrl}/api/user/subscription?action=preferences" style="color: #6b7280; text-decoration: none; margin: 0 8px;">Preferences</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                      © 2026 The Low Noise. All rights reserved.
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
THE LOW NOISE - YOUR DAILY AI INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆕 NEW NEWSLETTER PUBLISHED

${newsletter.title}

${newsletter.authorName} • ${this.formatDate(newsletter.publishedAt)}${newsletter.metadata?.readTime ? ` • ${newsletter.metadata.readTime} min read` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PREVIEW:

${textPreview}...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the full newsletter:
${newsletterUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Why you're receiving this:
You're subscribed to The Low Noise newsletter. We handpick the most important AI news and deliver it to your inbox daily at 7 AM.

Stay informed, stay ahead. Questions or feedback? Just reply to this email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Low Noise
Curated AI news without the noise

Visit: ${baseUrl}
Unsubscribe: ${baseUrl}/api/user/subscription?action=unsubscribe
Manage Preferences: ${baseUrl}/api/user/subscription?action=preferences

© 2026 The Low Noise. All rights reserved.
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
