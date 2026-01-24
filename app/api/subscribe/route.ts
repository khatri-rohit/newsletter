import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { z } from "zod";

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * POST /api/subscribe
 * Subscribe a new email to the newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate email
    const validation = emailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email } = validation.data;
    const db = admin.firestore();
    const subscribersRef = db.collection("subscribers");

    // Check if email already exists
    const existingSubscriber = await subscribersRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingSubscriber.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "This email is already subscribed!",
        },
        { status: 409 },
      );
    }

    // Add new subscriber
    await subscribersRef.add({
      email: email,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "active",
    });

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed! Check your inbox.",
    });
  } catch (error) {
    console.error("Error subscribing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
