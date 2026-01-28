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
 * Check if user is subscribed OR handle unsubscribe action
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const email = searchParams.get('email');

    // Handle unsubscribe action (from email links)
    if (action === 'unsubscribe') {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email parameter is required for unsubscribe' },
          { status: 400 }
        );
      }

      try {
        const userService = getUserService();

        // Check if subscriber exists
        const subscriber = await userService.getSubscriberByEmail(email);

        if (!subscriber) {
          return NextResponse.json(
            { success: false, error: 'Email not found in subscriber list' },
            { status: 404 }
          );
        }

        // Update subscriber status to unsubscribed
        await userService.updateSubscriberStatus(email, 'unsubscribed');

        console.log(`[Unsubscribe] Successfully unsubscribed: ${email}`);

        // Return HTML response for better UX
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribed - The Low Noise</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap');
              body {
                margin: 0;
                padding: 0;
                font-family: 'Space Mono', 'Courier New', monospace;
                background: linear-gradient(165deg, #000 0%, #1a1a1a 50%, #000 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                max-width: 600px;
                margin: 40px 20px;
                background: #0a0a0a;
                border: 1px solid #00ff41;
                box-shadow: 0 0 40px rgba(0, 255, 65, 0.15);
                padding: 60px 40px;
                text-align: center;
              }
              h1 {
                color: #00ff41;
                font-size: 32px;
                margin: 0 0 20px;
                text-transform: uppercase;
                letter-spacing: 2px;
                text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
              }
              p {
                color: #e0e0e0;
                font-size: 16px;
                line-height: 1.8;
                margin: 0 0 30px;
              }
              .email {
                color: #00ff41;
                font-weight: 700;
              }
              .button {
                display: inline-block;
                padding: 16px 40px;
                background: #00ff41;
                color: #000;
                text-decoration: none;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 0 30px rgba(0, 255, 65, 0.5);
                transition: all 0.3s ease;
                margin-top: 20px;
              }
              .button:hover {
                box-shadow: 0 0 50px rgba(0, 255, 65, 0.8);
                transform: scale(1.05);
              }
              .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #00ff41 50%, transparent 100%);
                margin: 40px 0;
              }
              .footer {
                color: #666;
                font-size: 12px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Unsubscribed</h1>
              <p>
                You've been successfully unsubscribed from The Low Noise newsletter.
              </p>
              <p>
                Email: <span class="email">${email}</span>
              </p>
              <div class="divider"></div>
              <p>
                We're sorry to see you go. If you change your mind, you can always 
                subscribe again by signing in to your account.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
                &gt;&gt; Back to Site
              </a>
              <div class="footer">
                © 2026 THE LOW NOISE // ALL TRANSMISSIONS SECURED
              </div>
            </div>
          </body>
          </html>
          `,
          {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
      } catch (error) {
        console.error('[Unsubscribe] Error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to process unsubscribe request' },
          { status: 500 }
        );
      }
    }

    // Handle preferences action (placeholder for future implementation)
    if (action === 'preferences') {
      // Redirect to preferences page (to be implemented)
      return NextResponse.redirect(
        new URL('/preferences', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    // Default: Check subscription status (requires authentication)
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
