import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { NewsletterService } from '@/services/newsletter.service';
import { getEmailQueueService } from '@/services/email-queue.service';
import { getEmailTrackingService } from '@/services/email-tracking.service';
import { getUserService } from '@/services/user.service';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================
// maxDuration: Maximum function execution time for email sending
// dynamic: Ensures the route is not cached
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const newsletterService = new NewsletterService();
const emailQueueService = getEmailQueueService();
const emailTrackingService = getEmailTrackingService();
const userService = getUserService();

/**
 * POST /api/newsletters/[id]/publish
 * Publish a newsletter and send notifications to all active subscribers
 *
 * Enterprise-grade implementation:
 * - Publishes newsletter to database
 * - Queues emails to all active subscribers
 * - Sends emails one by one with 10-second intervals
 * - Tracks delivery status, opens, and bounces
 * - Implements retry logic with exponential backoff
 * - Handles failures gracefully with detailed logging
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const correlationId = `publish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${correlationId}] Newsletter publish request started`);

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log(`[${correlationId}] Unauthorized: Missing or invalid auth header`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if user is admin
    if (decodedToken.role !== 'admin') {
      console.log(`[${correlationId}] Forbidden: User ${decodedToken.uid} is not admin`);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required', correlationId },
        { status: 403 }
      );
    }

    console.log(`[${correlationId}] Authenticated as admin: ${decodedToken.email}`);

    const { id } = await params;

    // Step 1: Publish the newsletter
    console.log(`[${correlationId}] Publishing newsletter: ${id}`);
    const newsletter = await newsletterService.publishNewsletter(id);
    console.log(`[${correlationId}] Newsletter published: ${newsletter.title}`);

    // Step 2: Get active subscribers count
    const subscribers = await userService.getAllActiveSubscribers();
    const subscriberCount = subscribers.length;

    console.log(`[${correlationId}] Found ${subscriberCount} active subscribers`);

    if (subscriberCount === 0) {
      console.log(`[${correlationId}] No active subscribers, skipping email notifications`);
      return NextResponse.json({
        success: true,
        data: newsletter,
        message: 'Newsletter published successfully (no active subscribers)',
        correlationId,
        stats: {
          subscribers: 0,
          emailsSent: 0,
          processingTime: Date.now() - startTime,
        },
      });
    }

    // Step 3: Create delivery tracking records for all subscribers
    console.log(`[${correlationId}] Creating delivery tracking records...`);
    const trackingPromises = subscribers.map((subscriber) =>
      emailTrackingService.createDeliveryRecord({
        newsletterId: newsletter.id!,
        newsletterTitle: newsletter.title,
        recipientEmail: subscriber.email,
        recipientName: subscriber.name,
        recipientUserId: subscriber.userId,
        subject: `📰 ${newsletter.title} - The Low Noise`,
      })
    );
    await Promise.all(trackingPromises);
    console.log(`[${correlationId}] Created ${trackingPromises.length} tracking records`);

    // Step 4: Send newsletter to all active subscribers using queue service
    // IMPORTANT: In serverless environments (Vercel), we MUST await email sending
    // because background tasks are killed when the response is returned.
    console.log(`[${correlationId}] Starting email queue processing...`);

    let emailStats = { sent: 0, failed: 0, total: subscriberCount };

    try {
      const stats = await emailQueueService.sendNewsletterToSubscribers(newsletter, {
        batchSize: 5, // Send 5 emails in parallel for faster processing
        delayBetweenEmails: 1000, // 1 second between batches (reduced for serverless timeout)
        maxRetries: 2, // Reduced retries to stay within timeout
        retryDelay: 5000, // 5 seconds before retry (reduced for serverless)
        onProgress: (progressStats) => {
          console.log(
            `[${correlationId}] Email progress: ${progressStats.sent}/${progressStats.total} sent, ` +
              `${progressStats.failed} failed, ${progressStats.bounced} bounced`
          );
        },
        onComplete: (finalStats) => {
          console.log(`[${correlationId}] Email sending complete:`, finalStats);
          console.log(
            `[${correlationId}] Success rate: ${finalStats.successRate}% ` +
              `(${finalStats.sent}/${finalStats.total})`
          );
        },
        onError: async (error, item) => {
          console.error(
            `[${correlationId}] Error sending to ${item.recipient.email}:`,
            error.message
          );

          // Update tracking for failed emails
          if (item.status === 'bounced') {
            await emailTrackingService.markAsBounced(
              item.newsletterId,
              item.recipient.email,
              error.message
            );
          } else {
            await emailTrackingService.markAsFailed(
              item.newsletterId,
              item.recipient.email,
              error.message
            );
          }
        },
      });

      emailStats = {
        sent: stats.sent,
        failed: stats.failed + stats.bounced,
        total: stats.total,
      };

      // Update tracking records for successfully sent emails
      const sentItems = emailQueueService.getQueue().filter((item) => item.status === 'sent');
      for (const item of sentItems) {
        await emailTrackingService.markAsSent(item.newsletterId, item.recipient.email);
      }

      console.log(`[${correlationId}] All emails processed. Final stats:`, stats);
    } catch (emailError) {
      console.error(`[${correlationId}] Error in email sending:`, emailError);
      // Continue with response even if email sending fails partially
    }

    // Return success response with actual email stats
    const processingTime = Date.now() - startTime;
    console.log(
      `[${correlationId}] API response sent (${processingTime}ms). Email stats:`,
      emailStats
    );

    return NextResponse.json({
      success: true,
      data: newsletter,
      message: `Newsletter published successfully. Emails sent: ${emailStats.sent}/${emailStats.total}`,
      correlationId,
      stats: {
        subscribers: subscriberCount,
        emailsSent: emailStats.sent,
        emailsFailed: emailStats.failed,
        processingTime,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${correlationId}] Error publishing newsletter (${processingTime}ms):`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish newsletter',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}
