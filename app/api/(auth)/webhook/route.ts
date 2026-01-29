// ==========================================
// AUTH WEBHOOK API - HANDLE USER AUTH EVENTS
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import crypto from 'crypto';
import { getUserService } from '@/services/user.service';
import { getEmailService } from '@/services/email.service';

// ==========================================
// INITIALIZE FIREBASE ADMIN (if not already)
// ==========================================

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const AuthEventSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  provider: z.string(),
  idToken: z.string().min(1), // For verification
});

// ==========================================
// STRUCTURED LOGGING
// ==========================================

interface LogContext {
  correlationId: string;
  uid?: string;
  email?: string;
  provider?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  isNewUser?: boolean;
}

class Logger {
  private log(level: string, message: string, context: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, context: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context: LogContext) {
    this.log('ERROR', message, context);
  }
}

const logger = new Logger();

// ==========================================
// RATE LIMITING (Simple in-memory)
// ==========================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

// ==========================================
// MAIN HANDLER
// ==========================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // ==========================================
    // 1. RATE LIMITING
    // ==========================================
    const clientIp =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(clientIp)) {
      logger.warn('Rate limit exceeded', { correlationId });
      return NextResponse.json(
        {
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          correlationId,
        },
        { status: 429 }
      );
    }

    // ==========================================
    // 2. PARSE & VALIDATE REQUEST BODY
    // ==========================================
    let body;
    try {
      body = await req.json();
    } catch {
      logger.warn('Invalid JSON body', { correlationId });
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Invalid JSON body',
          correlationId,
        },
        { status: 400 }
      );
    }

    let validatedData: z.infer<typeof AuthEventSchema>;
    try {
      validatedData = AuthEventSchema.parse(body);
    } catch (validationError) {
      const err = validationError as z.ZodError;
      logger.warn('Validation failed', {
        correlationId,
        error: err.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Invalid request data',
          details: err.issues,
          correlationId,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. VERIFY FIREBASE ID TOKEN
    // ==========================================
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(validatedData.idToken);

      // Ensure the token UID matches the claimed UID
      if (decodedToken.uid !== validatedData.uid) {
        throw new Error('UID mismatch');
      }
    } catch (authError) {
      logger.warn('Token verification failed', {
        correlationId,
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          correlationId,
        },
        { status: 401 }
      );
    }

    logger.info('Auth webhook triggered', {
      correlationId,
      uid: validatedData.uid,
      email: validatedData.email,
      provider: validatedData.provider,
    });

    // ==========================================
    // 4. CHECK AND SET ADMIN ROLE (Strict Admin Check)
    // ==========================================
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rohitkhatri111112@gmail.com';
    const ADMIN_NAME = process.env.ADMIN_NAME || 'Rohit Khatri';

    if (!ADMIN_EMAIL || !ADMIN_NAME) {
      logger.error('Admin configuration missing', { correlationId });
      throw new Error('Admin configuration not set');
    }

    const isAdminUser =
      validatedData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      validatedData.displayName?.toLowerCase() === ADMIN_NAME.toLowerCase();

    if (isAdminUser) {
      try {
        // Set admin custom claims in Firebase Auth
        await admin.auth().setCustomUserClaims(validatedData.uid, { role: 'admin' });

        logger.info('Admin role assigned', {
          correlationId,
          uid: validatedData.uid,
          email: validatedData.email,
        });
      } catch (claimError) {
        logger.error('Failed to set admin claims', {
          correlationId,
          uid: validatedData.uid,
          error: claimError instanceof Error ? claimError.message : 'Unknown error',
        });
      }
    }

    // ==========================================
    // 5. HANDLE USER AUTHENTICATION
    // ==========================================
    const userService = getUserService();
    const emailService = getEmailService();

    let authResult;
    try {
      authResult = await userService.handleUserAuth({
        uid: validatedData.uid,
        email: validatedData.email,
        displayName: validatedData.displayName,
        photoURL: validatedData.photoURL,
        provider: validatedData.provider,
        ip: clientIp,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      // Update role in Firestore if admin
      if (isAdminUser) {
        await userService.updateUserRole(validatedData.uid, 'admin');
        logger.info('Admin role updated in Firestore', {
          correlationId,
          uid: validatedData.uid,
        });
      }
    } catch (serviceError) {
      logger.error('User service error', {
        correlationId,
        uid: validatedData.uid,
        error: serviceError instanceof Error ? serviceError.message : 'Unknown error',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to process user authentication',
          correlationId,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 6. SEND APPROPRIATE EMAIL
    // ==========================================
    const emailType = authResult.isNewUser ? 'welcome' : 'relogin';

    // Send email asynchronously (don't block response)
    (async () => {
      try {
        const name = validatedData.displayName || validatedData.email.split('@')[0];

        if (authResult.isNewUser) {
          await emailService.sendWelcomeEmail(name, validatedData.email);
          logger.info('Welcome email sent', {
            correlationId,
            uid: validatedData.uid,
            email: validatedData.email,
          });
        } else {
          await emailService.sendReLoginEmail(name, validatedData.email);
          logger.info('Re-login email sent', {
            correlationId,
            uid: validatedData.uid,
            email: validatedData.email,
          });
        }
      } catch (emailError) {
        // Log error but don't fail the request
        logger.error('Email sending failed', {
          correlationId,
          uid: validatedData.uid,
          email: validatedData.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    })();

    // ==========================================
    // 7. RETURN SUCCESS RESPONSE
    // ==========================================
    const duration = Date.now() - startTime;

    logger.info('Auth webhook processed successfully', {
      correlationId,
      uid: validatedData.uid,
      email: validatedData.email,
      isNewUser: authResult.isNewUser,
      duration,
      statusCode: 200,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          isNewUser: authResult.isNewUser,
          emailType,
          user: {
            uid: authResult.user.uid,
            email: authResult.user.email,
            displayName: authResult.user.displayName,
            role: authResult.user.role,
          },
        },
        correlationId,
      },
      {
        status: 200,
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    // ==========================================
    // GLOBAL ERROR HANDLER
    // ==========================================
    const duration = Date.now() - startTime;

    logger.error('Unhandled error in auth webhook', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        correlationId,
      },
      { status: 500 }
    );
  }
}

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'auth-webhook',
    timestamp: new Date().toISOString(),
  });
}
