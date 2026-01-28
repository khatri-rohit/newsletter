// ==========================================
// EMAIL DELIVERY TRACKING SERVICE
// ==========================================

import * as admin from 'firebase-admin';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface EmailDelivery {
  id?: string;
  newsletterId: string;
  newsletterTitle: string;
  recipientEmail: string;
  recipientName?: string;
  recipientUserId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  attempts: number;
  sentAt?: Date | admin.firestore.Timestamp;
  deliveredAt?: Date | admin.firestore.Timestamp;
  openedAt?: Date | admin.firestore.Timestamp;
  clickedAt?: Date | admin.firestore.Timestamp;
  bouncedAt?: Date | admin.firestore.Timestamp;
  failedAt?: Date | admin.firestore.Timestamp;
  error?: string;
  metadata?: {
    subject?: string;
    userAgent?: string;
    ipAddress?: string;
    linkClicked?: string;
    bounceReason?: string;
  };
  createdAt: Date | admin.firestore.Timestamp;
  updatedAt: Date | admin.firestore.Timestamp;
}

export interface EmailDeliveryStats {
  newsletterId: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EmailCampaignSummary {
  newsletterId: string;
  newsletterTitle: string;
  publishedAt: Date;
  stats: EmailDeliveryStats;
  topPerformingLinks?: Array<{
    url: string;
    clicks: number;
  }>;
  failureReasons?: Array<{
    reason: string;
    count: number;
  }>;
}

// ==========================================
// EMAIL TRACKING SERVICE CLASS
// ==========================================

export class EmailTrackingService {
  private db: admin.firestore.Firestore;
  private deliveriesCollection: admin.firestore.CollectionReference;

  constructor() {
    getFirebaseAdmin();
    this.db = admin.firestore();
    this.deliveriesCollection = this.db.collection('emailDeliveries');
    console.log('[EmailTrackingService] Initialized');
  }

  /**
   * Create delivery record when email is queued
   */
  async createDeliveryRecord(data: {
    newsletterId: string;
    newsletterTitle: string;
    recipientEmail: string;
    recipientName?: string;
    recipientUserId?: string;
    subject?: string;
  }): Promise<string> {
    try {
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Build delivery data object, only including optional fields if they're defined
      const deliveryData: Record<string, unknown> = {
        newsletterId: data.newsletterId,
        newsletterTitle: data.newsletterTitle,
        recipientEmail: data.recipientEmail,
        status: 'pending',
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Only add optional fields if they have values
      if (data.recipientName) {
        deliveryData.recipientName = data.recipientName;
      }

      if (data.recipientUserId) {
        deliveryData.recipientUserId = data.recipientUserId;
      }

      // Only add metadata if subject exists
      if (data.subject) {
        deliveryData.metadata = {
          subject: data.subject,
        };
      }

      const docRef = await this.deliveriesCollection.add(deliveryData);
      console.log(`[EmailTracking] Created delivery record: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[EmailTracking] Error creating delivery record:', error);
      throw error;
    }
  }

  /**
   * Update delivery status to sent
   */
  async markAsSent(newsletterId: string, recipientEmail: string): Promise<void> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('recipientEmail', '==', recipientEmail)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          attempts: admin.firestore.FieldValue.increment(1),
        });
        console.log(`[EmailTracking] Marked as sent: ${recipientEmail}`);
      }
    } catch (error) {
      console.error('[EmailTracking] Error marking as sent:', error);
    }
  }

  /**
   * Mark email as delivered (successful delivery confirmation)
   */
  async markAsDelivered(newsletterId: string, recipientEmail: string): Promise<void> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('recipientEmail', '==', recipientEmail)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.update({
          status: 'delivered',
          deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[EmailTracking] Marked as delivered: ${recipientEmail}`);
      }
    } catch (error) {
      console.error('[EmailTracking] Error marking as delivered:', error);
    }
  }

  /**
   * Track email open
   */
  async trackOpen(
    newsletterId: string,
    recipientEmail: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('recipientEmail', '==', recipientEmail)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const currentData = querySnapshot.docs[0].data();

        await docRef.update({
          status: 'opened',
          openedAt: currentData.openedAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          'metadata.userAgent': metadata?.userAgent,
          'metadata.ipAddress': metadata?.ipAddress,
        });

        console.log(`[EmailTracking] Tracked open: ${recipientEmail}`);
      }
    } catch (error) {
      console.error('[EmailTracking] Error tracking open:', error);
    }
  }

  /**
   * Track link click
   */
  async trackClick(
    newsletterId: string,
    recipientEmail: string,
    linkUrl: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('recipientEmail', '==', recipientEmail)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const currentData = querySnapshot.docs[0].data();

        await docRef.update({
          status: 'clicked',
          clickedAt: currentData.clickedAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          'metadata.linkClicked': linkUrl,
          'metadata.userAgent': metadata?.userAgent,
          'metadata.ipAddress': metadata?.ipAddress,
        });

        console.log(`[EmailTracking] Tracked click: ${recipientEmail} -> ${linkUrl}`);
      }
    } catch (error) {
      console.error('[EmailTracking] Error tracking click:', error);
    }
  }

  /**
   * Mark email as bounced
   */
  async markAsBounced(
    newsletterId: string,
    recipientEmail: string,
    bounceReason?: string
  ): Promise<void> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('recipientEmail', '==', recipientEmail)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.update({
          status: 'bounced',
          bouncedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          'metadata.bounceReason': bounceReason,
        });
        console.log(`[EmailTracking] Marked as bounced: ${recipientEmail}`);
      }
    } catch (error) {
      console.error('[EmailTracking] Error marking as bounced:', error);
    }
  }

  /**
   * Mark email as failed
   */
  async markAsFailed(
    newsletterId: string,
    recipientEmail: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('recipientEmail', '==', recipientEmail)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.update({
          status: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: errorMessage,
          attempts: admin.firestore.FieldValue.increment(1),
        });
        console.log(`[EmailTracking] Marked as failed: ${recipientEmail}`);
      }
    } catch (error) {
      console.error('[EmailTracking] Error marking as failed:', error);
    }
  }

  /**
   * Get delivery statistics for a newsletter
   */
  async getNewsletterStats(newsletterId: string): Promise<EmailDeliveryStats> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .get();

      const deliveries = querySnapshot.docs.map((doc) => doc.data() as EmailDelivery);

      const stats = {
        newsletterId,
        totalSent: deliveries.filter((d) =>
          ['sent', 'delivered', 'opened', 'clicked'].includes(d.status)
        ).length,
        delivered: deliveries.filter((d) => ['delivered', 'opened', 'clicked'].includes(d.status))
          .length,
        opened: deliveries.filter((d) => ['opened', 'clicked'].includes(d.status)).length,
        clicked: deliveries.filter((d) => d.status === 'clicked').length,
        bounced: deliveries.filter((d) => d.status === 'bounced').length,
        failed: deliveries.filter((d) => d.status === 'failed').length,
        pending: deliveries.filter((d) => d.status === 'pending').length,
      };

      const total = deliveries.length || 1; // Avoid division by zero

      return {
        ...stats,
        deliveryRate: Math.round((stats.delivered / stats.totalSent) * 100 * 100) / 100,
        openRate: Math.round((stats.opened / stats.delivered) * 100 * 100) / 100,
        clickRate: Math.round((stats.clicked / stats.opened) * 100 * 100) / 100,
        bounceRate: Math.round((stats.bounced / total) * 100 * 100) / 100,
      };
    } catch (error) {
      console.error('[EmailTracking] Error getting newsletter stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed campaign summary
   */
  async getCampaignSummary(newsletterId: string): Promise<EmailCampaignSummary | null> {
    try {
      const stats = await this.getNewsletterStats(newsletterId);

      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const firstDelivery = querySnapshot.docs[0].data() as EmailDelivery;

      // Get top performing links (would need additional tracking)
      const clickedSnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('status', '==', 'clicked')
        .get();

      const linkClicks = new Map<string, number>();
      clickedSnapshot.docs.forEach((doc) => {
        const link = doc.data().metadata?.linkClicked;
        if (link) {
          linkClicks.set(link, (linkClicks.get(link) || 0) + 1);
        }
      });

      const topPerformingLinks = Array.from(linkClicks.entries())
        .map(([url, clicks]) => ({ url, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      // Get failure reasons
      const failedSnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .where('status', 'in', ['failed', 'bounced'])
        .get();

      const failureReasons = new Map<string, number>();
      failedSnapshot.docs.forEach((doc) => {
        const reason = doc.data().error || doc.data().metadata?.bounceReason || 'Unknown';
        failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      });

      const topFailureReasons = Array.from(failureReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      return {
        newsletterId,
        newsletterTitle: firstDelivery.newsletterTitle,
        publishedAt:
          firstDelivery.createdAt instanceof admin.firestore.Timestamp
            ? firstDelivery.createdAt.toDate()
            : new Date(firstDelivery.createdAt),
        stats,
        topPerformingLinks: topPerformingLinks.length > 0 ? topPerformingLinks : undefined,
        failureReasons: topFailureReasons.length > 0 ? topFailureReasons : undefined,
      };
    } catch (error) {
      console.error('[EmailTracking] Error getting campaign summary:', error);
      throw error;
    }
  }

  /**
   * Get all deliveries for a newsletter (for admin dashboard)
   */
  async getNewsletterDeliveries(newsletterId: string, limit = 100): Promise<EmailDelivery[]> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('newsletterId', '==', newsletterId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailDelivery[];
    } catch (error) {
      console.error('[EmailTracking] Error getting newsletter deliveries:', error);
      throw error;
    }
  }

  /**
   * Get delivery history for a specific email
   */
  async getEmailDeliveryHistory(email: string, limit = 50): Promise<EmailDelivery[]> {
    try {
      const querySnapshot = await this.deliveriesCollection
        .where('recipientEmail', '==', email)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailDelivery[];
    } catch (error) {
      console.error('[EmailTracking] Error getting email delivery history:', error);
      throw error;
    }
  }

  /**
   * Clean up old delivery records (data retention)
   */
  async cleanupOldRecords(daysToKeep = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const querySnapshot = await this.deliveriesCollection
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .limit(500)
        .get();

      if (querySnapshot.empty) {
        return 0;
      }

      const batch = this.db.batch();
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`[EmailTracking] Cleaned up ${querySnapshot.size} old records`);
      return querySnapshot.size;
    } catch (error) {
      console.error('[EmailTracking] Error cleaning up old records:', error);
      throw error;
    }
  }
}

// Singleton instance
let emailTrackingServiceInstance: EmailTrackingService | null = null;

export function getEmailTrackingService(): EmailTrackingService {
  if (!emailTrackingServiceInstance) {
    emailTrackingServiceInstance = new EmailTrackingService();
  }
  return emailTrackingServiceInstance;
}
