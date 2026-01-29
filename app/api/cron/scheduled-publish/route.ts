import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { NewsletterService } from '@/services/newsletter.service';
import { getEmailQueueService } from '@/services/email-queue.service';
import { getEmailTrackingService } from '@/services/email-tracking.service';
import { getUserService } from '@/services/user.service';

// ==========================================
// ROUTE CONFIGURATION FOR VERCEL CRON JOBS
// ==========================================
// maxDuration: Maximum function execution time in seconds
// - Hobby: 10s max, Pro: 60s max, Enterprise: 900s max
// - Set to 60 for Pro plan to handle email sending
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
 * GET /api/cron/scheduled-publish
 *
 * Vercel Cron Job: Runs daily at 9:00 AM to check for scheduled newsletters
 * and automatically publish them with email notifications to subscribers.
 *
 * Enterprise-grade features:
 * - Secure authorization using cron secret
 * - Fetches all newsletters with status 'scheduled' and scheduledFor <= now
 * - Publishes each newsletter to database
 * - Sends emails to all active subscribers with retry logic
 * - Tracks delivery status with comprehensive logging
 * - Handles failures gracefully with detailed error reporting
 * - Returns summary of all processing
 *
 * Security:
 * - Requires CRON_SECRET environment variable
 * - Only accessible via Vercel cron or with proper authorization header
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `cron-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${correlationId}] ===== CRON JOB STARTED: Scheduled Newsletter Publishing =====`);
  console.log(`[${correlationId}] Time: ${new Date().toISOString()}`);

  try {
    // ==========================================
    // STEP 1: VERIFY AUTHORIZATION
    // ==========================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(`[${correlationId}] CRON_SECRET environment variable is not set`);
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
          correlationId,
        },
        { status: 500 }
      );
    }

    // Verify the request is from Vercel Cron or has valid authorization
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== cronSecret) {
      console.error(`[${correlationId}] Unauthorized cron access attempt`);
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          correlationId,
        },
        { status: 401 }
      );
    }

    console.log(`[${correlationId}] Authorization verified successfully`);

    // ==========================================
    // STEP 2: FETCH SCHEDULED NEWSLETTERS
    // ==========================================
    console.log(`[${correlationId}] Fetching newsletters scheduled for publishing...`);

    const scheduledNewsletters = await newsletterService.getScheduledNewslettersDue();

    if (scheduledNewsletters.length === 0) {
      console.log(`[${correlationId}] No newsletters scheduled for publishing at this time`);

      return NextResponse.json({
        success: true,
        message: 'No newsletters scheduled for publishing',
        data: {
          processed: 0,
          successful: 0,
          failed: 0,
          results: [],
        },
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    console.log(`[${correlationId}] Found ${scheduledNewsletters.length} newsletter(s) to publish`);

    // ==========================================
    // STEP 3: PROCESS EACH NEWSLETTER
    // ==========================================
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const newsletter of scheduledNewsletters) {
      const nlStartTime = Date.now();
      const nlId = newsletter.id!;

      console.log(`[${correlationId}] ========================================`);
      console.log(`[${correlationId}] Processing newsletter: ${nlId}`);
      console.log(`[${correlationId}] Title: "${newsletter.title}"`);
      console.log(`[${correlationId}] Scheduled for: ${newsletter.scheduledFor}`);

      try {
        // ==========================================
        // STEP 3.1: PUBLISH NEWSLETTER
        // ==========================================
        console.log(`[${correlationId}] Publishing newsletter to database...`);
        const publishedNewsletter = await newsletterService.publishNewsletter(nlId);
        console.log(`[${correlationId}] Newsletter published successfully`);

        // ==========================================
        // STEP 3.2: GET ACTIVE SUBSCRIBERS
        // ==========================================
        console.log(`[${correlationId}] Fetching active subscribers...`);
        const subscribers = await userService.getAllActiveSubscribers();
        const subscriberCount = subscribers.length;

        console.log(`[${correlationId}] Found ${subscriberCount} active subscriber(s)`);

        if (subscriberCount === 0) {
          console.log(`[${correlationId}] No active subscribers, skipping email notifications`);

          results.push({
            newsletterId: nlId,
            title: newsletter.title,
            status: 'success',
            published: true,
            emailsSent: 0,
            subscriberCount: 0,
            message: 'Newsletter published (no active subscribers)',
            processingTime: Date.now() - nlStartTime,
          });

          successCount++;
          continue;
        }

        // ==========================================
        // STEP 3.3: CREATE EMAIL TRACKING RECORDS
        // ==========================================
        console.log(`[${correlationId}] Creating delivery tracking records...`);

        const trackingPromises = subscribers.map((subscriber) =>
          emailTrackingService.createDeliveryRecord({
            newsletterId: nlId,
            newsletterTitle: newsletter.title,
            recipientEmail: subscriber.email,
            recipientName: subscriber.name,
            recipientUserId: subscriber.userId,
            subject: `📰 ${newsletter.title} - The Low Noise`,
          })
        );

        await Promise.all(trackingPromises);
        console.log(`[${correlationId}] Created ${trackingPromises.length} tracking records`);

        // ==========================================
        // STEP 3.4: SEND EMAILS SYNCHRONOUSLY
        // ==========================================
        // IMPORTANT: In serverless environments (Vercel), we MUST await email sending
        // because background tasks are killed when the response is returned.
        console.log(`[${correlationId}] Starting email queue processing...`);

        let emailStats = { sent: 0, failed: 0, total: subscriberCount };

        try {
          const stats = await emailQueueService.sendNewsletterToSubscribers(publishedNewsletter, {
            batchSize: 5, // Send 5 emails in parallel for faster processing
            delayBetweenEmails: 1000, // 1 second between batches (reduced for serverless timeout)
            maxRetries: 2, // Reduced retries to stay within timeout
            retryDelay: 5000, // 5 seconds before retry (reduced for serverless)
            onProgress: (progressStats) => {
              console.log(
                `[${correlationId}] Email progress for ${nlId}: ${progressStats.sent}/${progressStats.total} sent, ` +
                  `${progressStats.failed} failed, ${progressStats.bounced} bounced`
              );
            },
            onComplete: (finalStats) => {
              console.log(`[${correlationId}] Email sending complete for ${nlId}:`, finalStats);
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

          // Update tracking for successfully sent emails
          const sentItems = emailQueueService.getQueue().filter((item) => item.status === 'sent');
          for (const item of sentItems) {
            await emailTrackingService.markAsSent(item.newsletterId, item.recipient.email);
          }

          console.log(`[${correlationId}] All emails processed for ${nlId}. Final stats:`, stats);
        } catch (emailError) {
          console.error(`[${correlationId}] Error in email sending for ${nlId}:`, emailError);
          // Continue processing other newsletters even if email sending fails
        }

        // ==========================================
        // STEP 3.5: RECORD SUCCESS
        // ==========================================
        results.push({
          newsletterId: nlId,
          title: newsletter.title,
          status: 'success',
          published: true,
          emailsSent: emailStats.sent,
          emailsFailed: emailStats.failed,
          subscriberCount,
          message: `Newsletter published. Emails sent: ${emailStats.sent}/${emailStats.total}`,
          processingTime: Date.now() - nlStartTime,
        });

        successCount++;
        console.log(
          `[${correlationId}] Newsletter ${nlId} processed successfully in ${Date.now() - nlStartTime}ms`
        );
      } catch (error) {
        // ==========================================
        // HANDLE NEWSLETTER PROCESSING ERROR
        // ==========================================
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error(`[${correlationId}] Error processing newsletter ${nlId}:`, error);

        results.push({
          newsletterId: nlId,
          title: newsletter.title,
          status: 'failed',
          published: false,
          error: errorMessage,
          processingTime: Date.now() - nlStartTime,
        });

        failCount++;
      }
    }

    // ==========================================
    // STEP 4: RETURN SUMMARY
    // ==========================================
    const totalProcessingTime = Date.now() - startTime;

    console.log(`[${correlationId}] ========================================`);
    console.log(`[${correlationId}] CRON JOB COMPLETED`);
    console.log(`[${correlationId}] Total newsletters processed: ${scheduledNewsletters.length}`);
    console.log(`[${correlationId}] Successful: ${successCount}`);
    console.log(`[${correlationId}] Failed: ${failCount}`);
    console.log(`[${correlationId}] Total processing time: ${totalProcessingTime}ms`);
    console.log(`[${correlationId}] ===== CRON JOB FINISHED =====`);

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledNewsletters.length} newsletter(s)`,
      data: {
        processed: scheduledNewsletters.length,
        successful: successCount,
        failed: failCount,
        results,
      },
      correlationId,
      processingTime: totalProcessingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // ==========================================
    // HANDLE GLOBAL ERROR
    // ==========================================
    const totalProcessingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[${correlationId}] FATAL ERROR in cron job (${totalProcessingTime}ms):`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled newsletters',
        details: errorMessage,
        correlationId,
        processingTime: totalProcessingTime,
      },
      { status: 500 }
    );
  }
}
