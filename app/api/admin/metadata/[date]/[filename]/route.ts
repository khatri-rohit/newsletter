/* eslint-disable @typescript-eslint/no-explicit-any */
import { R2Service } from '@/services/r2.service';
import { ContentMetadata } from '@/services/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// ==========================================
// FIREBASE ADMIN INITIALIZATION
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

const RouteParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD'),
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[\w\-. ]+\.(md)$/, 'Invalid filename format'),
});

const R2ConfigSchema = z.object({
  accountId: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  accessKeyId: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  secretAccessKey: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  bucketName: z.string().min(1, 'R2_BUCKET_NAME is required'),
});

// ==========================================
// CONFIGURATION & ENVIRONMENT
// ==========================================

function getR2Config() {
  try {
    return R2ConfigSchema.parse({
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME || 'metadata-data-ingestion',
    });
  } catch (error: any) {
    const err = error as Error;
    throw new Error(`Invalid R2 configuration: ${err.message}`);
    throw new Error('Invalid R2 configuration. Check environment variables.');
  }
}

// ==========================================
// CACHING LAYER
// ==========================================

interface CacheEntry {
  data: ContentMetadata;
  timestamp: number;
  etag: string;
}

class MetadataCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 100; // Max cached items

  getCacheKey(date: string, filename: string): string {
    return `${date}/${filename}`;
  }

  get(date: string, filename: string): ContentMetadata | null {
    const key = this.getCacheKey(date, filename);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(date: string, filename: string, data: ContentMetadata): void {
    // LRU eviction if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey!);
    }

    const key = this.getCacheKey(date, filename);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag: crypto.createHash('md5').update(JSON.stringify(data)).digest('hex'),
    });
  }

  invalidate(date: string, filename: string): void {
    const key = this.getCacheKey(date, filename);
    this.cache.delete(key);
  }
}

const metadataCache = new MetadataCache();

// ==========================================
// STRUCTURED LOGGING
// ==========================================

interface LogContext {
  correlationId: string;
  date?: string;
  filename?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  role?: string;
  stack?: string;
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

    // In production, send to logging service (e.g., CloudWatch, Datadog)
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
// CIRCUIT BREAKER
// ==========================================

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

const r2CircuitBreaker = new CircuitBreaker();

// ==========================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ==========================================

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

async function authenticate(
  req: NextRequest
): Promise<{ userId: string; role: string; email?: string }> {
  // Extract token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw new Error('Missing authentication token');
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract user information from the decoded token
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    const role = (decodedToken.role as string) || 'user';

    return {
      userId,
      email,
      role,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Provide specific error messages for common Firebase Auth errors
      if (error.message.includes('expired')) {
        throw new Error('Token has expired');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid authentication token');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed');
  }
}

// ==========================================
// MAIN ROUTE HANDLER
// ==========================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string; filename: string }> }
) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  const resolvedParams = await params;

  try {
    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================
    let user: { userId: string; role: string };
    try {
      user = await authenticate(req);
    } catch (authError) {
      logger.warn('Authentication failed', {
        correlationId,
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          correlationId,
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. AUTHORIZATION
    // ==========================================
    if (user.role !== 'admin') {
      logger.warn('Authorization failed', {
        correlationId,
        userId: user.userId,
        role: user.role,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
          correlationId,
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 3. INPUT VALIDATION
    // ==========================================
    let validatedParams: z.infer<typeof RouteParamsSchema>;
    try {
      validatedParams = RouteParamsSchema.parse({
        date: resolvedParams.date,
        filename: resolvedParams.filename,
      });
    } catch (validationError) {
      const err = validationError as z.ZodError;

      logger.warn('Validation failed', {
        correlationId,
        userId: user.userId,
        error: err.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Invalid parameters',
          details: err.issues,
          correlationId,
        },
        { status: 400 }
      );
    }

    const { date, filename } = validatedParams;

    logger.info('Metadata fetch request initiated', {
      correlationId,
      userId: user.userId,
      date,
      filename,
    });

    // ==========================================
    // 4. CACHE CHECK
    // ==========================================
    const cachedData = metadataCache.get(date, filename);
    if (cachedData) {
      logger.info('Cache hit', {
        correlationId,
        userId: user.userId,
        date,
        filename,
        duration: Date.now() - startTime,
        statusCode: 200,
      });

      return NextResponse.json(
        {
          success: true,
          data: cachedData,
          cached: true,
          correlationId,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    // ==========================================
    // 5. R2 SERVICE INITIALIZATION
    // ==========================================
    let r2Config;
    try {
      r2Config = getR2Config();
    } catch (configError) {
      logger.error('R2 configuration error', {
        correlationId,
        userId: user.userId,
        error: configError instanceof Error ? configError.message : 'Configuration error',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: 'Service configuration error',
          correlationId,
        },
        { status: 500 }
      );
    }

    const r2Service = new R2Service(r2Config);

    // ==========================================
    // 6. FETCH FROM R2 WITH RETRY & CIRCUIT BREAKER
    // ==========================================
    let content: any;
    try {
      content = await r2CircuitBreaker.execute(() =>
        withRetry(() => r2Service.getFileFromFolder(date, filename), 3, 1000)
      );
    } catch (fetchError) {
      logger.error('Failed to fetch from R2', {
        correlationId,
        userId: user.userId,
        date,
        filename,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        duration: Date.now() - startTime,
      });

      const isCircuitBreakerOpen =
        fetchError instanceof Error && fetchError.message.includes('Circuit breaker is OPEN');

      return NextResponse.json(
        {
          success: false,
          error: isCircuitBreakerOpen ? 'Service Unavailable' : 'Not Found',
          message: isCircuitBreakerOpen
            ? 'Storage service temporarily unavailable. Please try again later.'
            : `File '${filename}' not found in folder '${date}'`,
          correlationId,
        },
        { status: isCircuitBreakerOpen ? 503 : 404 }
      );
    }

    // ==========================================
    // 7. PARSE & VALIDATE METADATA
    // ==========================================
    let metadata: ContentMetadata;
    try {
      metadata = JSON.parse(content);

      // Optional: Add schema validation for ContentMetadata
      // const MetadataSchema = z.object({ ... });
      // metadata = MetadataSchema.parse(metadata);
    } catch (parseError) {
      logger.error('JSON parsing error', {
        correlationId,
        userId: user.userId,
        date,
        filename,
        error: parseError instanceof Error ? parseError.message : 'Parse error',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to parse file content',
          correlationId,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 8. CACHE & RETURN
    // ==========================================
    metadataCache.set(date, filename, metadata);

    const duration = Date.now() - startTime;

    logger.info('Metadata fetch successful', {
      correlationId,
      userId: user.userId,
      date,
      filename,
      duration,
      statusCode: 200,
    });

    return NextResponse.json(
      {
        success: true,
        data: metadata,
        cached: false,
        correlationId,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300',
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

    logger.error('Unhandled error', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
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
