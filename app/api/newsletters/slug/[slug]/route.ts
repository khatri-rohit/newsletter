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
 * GET /api/newsletters/slug/[slug]
 * Get a newsletter by slug and increment views
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 },
      );
    }

    const newsletter = await newsletterService.getNewsletterBySlug(slug);

    if (!newsletter) {
      return NextResponse.json(
        { success: false, error: "Newsletter not found" },
        { status: 404 },
      );
    }

    // Only show published newsletters to public
    if (newsletter.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Newsletter not available" },
        { status: 404 },
      );
    }

    // Increment views asynchronously (fire and forget)
    if (newsletter.id) {
      newsletterService.incrementViews(newsletter.id).catch((error) => {
        console.error("Error incrementing views:", error);
      });
    }

    return NextResponse.json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    console.error("Error fetching newsletter by slug:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch newsletter",
      },
      { status: 500 },
    );
  }
}
