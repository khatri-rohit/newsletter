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
 * GET /api/newsletters
 * List newsletters with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "draft"
      | "published"
      | "scheduled"
      | null;
    const authorId = searchParams.get("authorId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startAfter = searchParams.get("startAfter");

    const result = await newsletterService.listNewsletters({
      status: status || undefined,
      authorId: authorId || undefined,
      limit,
      startAfter: startAfter || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch newsletters",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/newsletters
 * Create a new newsletter
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const newsletter = await newsletterService.createNewsletter(body, {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      displayName: decodedToken.name,
    });

    return NextResponse.json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create newsletter",
      },
      { status: 500 },
    );
  }
}
