import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getUserService } from '@/services/user.service';

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
 * GET /api/user/subscription
 * Check if user is subscribed
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Subscription GET] Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing authentication token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      console.log('[Subscription GET] Empty token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('[Subscription GET] Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'User email not found' }, { status: 400 });
    }

    const userService = getUserService();
    const isSubscribed = await userService.isSubscribed(userEmail);
    const subscriber = await userService.getSubscriberByEmail(userEmail);

    return NextResponse.json({
      success: true,
      data: {
        subscribed: isSubscribed,
        email: userEmail,
        status: subscriber?.status || 'unsubscribed',
        subscribedAt: subscriber?.subscribedAt,
        preferences: subscriber?.preferences,
      },
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/subscription
 * Subscribe user to newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;
    const userName = decodedToken.name;
    const userId = decodedToken.uid;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'User email not found' }, { status: 400 });
    }

    const userService = getUserService();

    // Add or reactivate subscriber
    await userService.addSubscriber({
      email: userEmail,
      name: userName,
      userId: userId,
      source: 'auth',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
    });
  } catch (error) {
    console.error('Error subscribing user:', error);
    return NextResponse.json({ success: false, error: 'Failed to subscribe' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/subscription
 * Unsubscribe user from newsletter
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'User email not found' }, { status: 400 });
    }

    const userService = getUserService();
    await userService.updateSubscriberStatus(userEmail, 'unsubscribed');

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json({ success: false, error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
