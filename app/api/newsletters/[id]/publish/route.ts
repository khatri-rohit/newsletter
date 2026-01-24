import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { NewsletterService } from "@/services/newsletter.service";

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

const newsletterService = new NewsletterService();

/**
 * POST /api/newsletters/[id]/publish
 * Publish a newsletter
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if user is admin
    if (decodedToken.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const newsletter = await newsletterService.publishNewsletter(id);

    return NextResponse.json({
      success: true,
      data: newsletter,
      message: "Newsletter published successfully",
    });
  } catch (error) {
    console.error("Error publishing newsletter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to publish newsletter",
      },
      { status: 500 },
    );
  }
}
