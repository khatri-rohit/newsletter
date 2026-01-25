// ==========================================
// INPUT VALIDATION & SANITIZATION
// ==========================================

import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

// Newsletter validation schemas
export const createNewsletterSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  content: z.string().min(1, 'Content is required').max(1000000, 'Content is too large'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').trim().optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional().or(z.literal('')),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  scheduledFor: z.date().optional(),
});

export const updateNewsletterSchema = createNewsletterSchema.partial().extend({
  id: z.string().min(1, 'Newsletter ID is required'),
});

// Slug validation
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug is too long')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  );

// HTML sanitization
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove onclick, onerror, etc. event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

// Rate limit validation
export function validateRateLimit(
  limit: number,
  remaining: number
): { allowed: boolean; retryAfter?: number } {
  if (remaining <= 0) {
    return {
      allowed: false,
      retryAfter: 60, // seconds
    };
  }

  return { allowed: true };
}

// IP validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
