import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { subscribeRateLimiter, getClientIdentifier } from '@/lib/rate-limit';
import { emailSchema } from '@/lib/validation';

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

/**
 * POST /api/subscribe
 * Subscribe a new email to the newsletter
 * Includes rate limiting, validation, and duplicate checking
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for subscriptions
    const identifier = getClientIdentifier(request);
    const rateLimitResult = subscribeRateLimiter.check(5, identifier); // 5 requests per hour

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many subscription attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '3600', // 1 hour
          },
        }
      );
    }

    const body = await request.json();

    // Validate email
    const validation = emailSchema.safeParse(body.email);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const email = validation.data;
    const db = admin.firestore();
    const subscribersRef = db.collection('subscribers');

    // Check if email already exists
    const existingSubscriber = await subscribersRef.where('email', '==', email).limit(1).get();

    if (!existingSubscriber.empty) {
      // Check if unsubscribed
      const subscriberData = existingSubscriber.docs[0].data();

      if (subscriberData.status === 'unsubscribed') {
        // Reactivate subscription
        await existingSubscriber.docs[0].ref.update({
          status: 'active',
          resubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'This email is already subscribed!',
        },
        { status: 409 }
      );
    }

    // Add new subscriber
    await subscribersRef.add({
      email: email,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      source: 'website',
      metadata: {
        ip: identifier,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Check your inbox for confirmation.',
    });
  } catch (error) {
    console.error('Error subscribing:', error);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error tracking here
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong. Please try again.',
      },
      { status: 500 }
    );
  }
}
