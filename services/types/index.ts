// ==========================================
// SHARED TYPES FOR NEWSLETTER APPLICATION
// ==========================================

// ==========================================
// R2 STORAGE & CONTENT TYPES
// ==========================================

export interface ContentMetadata {
  newContentType: string;
  newMetadata: {
    key: string;
    type: string;
    title: string;
    authors: string;
    "source-name": string;
    "external-source-urls": string;
    "image-urls": string;
    url: string;
    timestamp: string;
    "feed-url": string;
  };
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

// ==========================================
// USER & AUTHENTICATION TYPES
// ==========================================

export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  provider: "google.com" | "github.com" | "password";
  role: "user" | "admin";
  isSubscribed: boolean;
  createdAt: Date | FirebaseFirestore.Timestamp;
  updatedAt: Date | FirebaseFirestore.Timestamp;
  lastLoginAt: Date | FirebaseFirestore.Timestamp;
  loginCount: number;
  metadata?: {
    ip?: string;
    userAgent?: string;
  };
}

export interface Subscriber {
  email: string;
  name?: string;
  userId?: string; // Link to users collection if authenticated
  subscribedAt: Date | FirebaseFirestore.Timestamp;
  status: "active" | "unsubscribed" | "bounced";
  source: "website" | "auth";
  preferences?: {
    frequency: "daily" | "weekly";
    categories?: string[];
  };
}

// ==========================================
// EMAIL TYPES
// ==========================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface NewsletterEmail {
  subject: string;
  htmlContent: string;
  textContent: string;
  scheduledFor?: Date;
  sentAt?: Date;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  correlationId?: string;
  cached?: boolean;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}

// ==========================================
// AUTH WEBHOOK TYPES
// ==========================================

export interface AuthWebhookRequest {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: string;
  idToken: string;
}

export interface AuthWebhookResponse {
  success: boolean;
  data?: {
    isNewUser: boolean;
    emailType: "welcome" | "relogin";
    user: {
      uid: string;
      email: string;
      displayName?: string | null;
      role: string;
    };
  };
  correlationId?: string;
}

// ==========================================
// NEWSLETTER CONTENT TYPES
// ==========================================

export interface Newsletter {
  id?: string;
  title: string;
  slug: string;
  content: string; // Rich HTML content from TipTap editor
  excerpt: string; // Short summary/preview
  thumbnail?: string; // URL to thumbnail image
  status: "draft" | "published" | "scheduled";
  authorId: string;
  authorName: string;
  authorEmail: string;
  tags?: string[];
  scheduledFor?: Date | FirebaseFirestore.Timestamp;
  publishedAt?: Date | FirebaseFirestore.Timestamp;
  createdAt: Date | FirebaseFirestore.Timestamp;
  updatedAt: Date | FirebaseFirestore.Timestamp;
  views?: number;
  metadata?: {
    readTime?: number; // Estimated read time in minutes
    wordCount?: number;
    imageCount?: number;
  };
}

export interface CreateNewsletterInput {
  title: string;
  content: string;
  excerpt: string;
  thumbnail?: string;
  tags?: string[];
  status?: "draft" | "published" | "scheduled";
  scheduledFor?: Date;
}

export interface UpdateNewsletterInput extends Partial<CreateNewsletterInput> {
  id: string;
}

// ==========================================
// NEWSLETTER STATS & ANALYTICS
// ==========================================

export interface SubscriberStats {
  active: number;
  unsubscribed: number;
  bounced: number;
  total: number;
}

export interface NewsletterStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

// ==========================================
// FIRESTORE NAMESPACE (for type compatibility)
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace FirebaseFirestore {
  interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
  }
}
