import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

// Initialize R2 client for newsletter images
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
});

/**
 * POST /api/upload/image
 * Upload image to R2 storage
 */
export async function POST(request: NextRequest) {
  console.log('[Upload API] === NEW REQUEST ===');

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('[Upload API] Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Upload API] Invalid auth header format');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('[Upload API] Verifying token...');

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('[Upload API] Token verified:', {
        uid: decodedToken.uid,
        role: decodedToken.role,
      });
    } catch (tokenError) {
      console.error('[Upload API] Token verification failed:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (decodedToken.role !== 'admin') {
      console.error('[Upload API] User is not admin:', decodedToken.uid);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    console.log('[Upload API] FormData entries:', Array.from(formData.keys()));

    const file = formData.get('file') as File;
    console.log('[Upload API] File received:', {
      exists: !!file,
      name: file?.name,
      type: file?.type,
      size: file?.size,
    });

    if (!file) {
      console.error('[Upload API] No file in formData');
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('[Upload API] Invalid file type:', file.type);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Only images are allowed.`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('[Upload API] File too large:', file.size);
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `newsletter-images/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2 (using dedicated image bucket)
    const bucketName = process.env.R2_IMAGE_BUCKET_NAME || process.env.R2_BUCKET_NAME;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Construct public URL
    // Option 1: If you have a custom domain for R2 public bucket
    // const imageUrl = `https://your-custom-domain.com/${filename}`;

    // Option 2: Using R2 public bucket (requires R2 bucket to be public)
    const imageUrl = `https://pub-80b14eac0e644afab28d83edb15a62be.r2.dev/${filename}`;

    console.log('Image uploaded successfully:', {
      filename,
      bucket: bucketName,
      url: imageUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        filename,
      },
    });
  } catch (error) {
    console.error('[Upload API] Exception caught:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    const isAuthError = errorMessage.includes('credentials') || errorMessage.includes('access');

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        hint: isAuthError ? 'Check R2 credentials in environment variables' : undefined,
      },
      { status: 500 }
    );
  }
}
