/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';
import { Newsletter, CreateNewsletterInput, UpdateNewsletterInput } from './types';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * Newsletter Service
 * Handles all newsletter CRUD operations with Firebase Firestore
 */
export class NewsletterService {
  private db: admin.firestore.Firestore;
  private newslettersCollection: admin.firestore.CollectionReference;

  constructor() {
    try {
      // Ensure Firebase Admin is initialized
      getFirebaseAdmin();
      this.db = admin.firestore();
      this.newslettersCollection = this.db.collection('newsletters');
      console.log('[NewsletterService] Initialized successfully');
    } catch (error) {
      console.error('[NewsletterService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Create a new newsletter
   */
  async createNewsletter(
    input: CreateNewsletterInput,
    author: {
      uid: string;
      email: string;
      displayName?: string | null;
    }
  ): Promise<Newsletter> {
    try {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const slug = this.generateSlug(input.title);

      // Calculate metadata
      const wordCount = this.countWords(input.content);
      const imageCount = this.countImages(input.content);
      const readTime = Math.ceil(wordCount / 200); // Average reading speed

      const newsletterData: any = {
        title: input.title,
        slug,
        content: input.content,
        excerpt: input.excerpt,
        thumbnail: input.thumbnail || '',
        status: input.status || 'draft',
        authorId: author.uid,
        authorName: author.displayName || author.email.split('@')[0],
        authorEmail: author.email,
        tags: input.tags || [],
        createdAt: now as admin.firestore.Timestamp,
        updatedAt: now as admin.firestore.Timestamp,
        views: 0,
        metadata: {
          readTime,
          wordCount,
          imageCount,
        },
      };

      // Only add scheduledFor if it exists and is a valid Date (avoid undefined)
      if (
        input.scheduledFor &&
        input.scheduledFor instanceof Date &&
        !isNaN(input.scheduledFor.getTime())
      ) {
        newsletterData.scheduledFor = admin.firestore.Timestamp.fromDate(input.scheduledFor);
      }

      // Only add publishedAt if status is published (avoid undefined)
      if (input.status === 'published') {
        newsletterData.publishedAt = now as admin.firestore.Timestamp;
      }

      const docRef = await this.newslettersCollection.add(newsletterData);

      return {
        id: docRef.id,
        ...newsletterData,
      } as Newsletter;
    } catch (error) {
      console.error('Error creating newsletter:', error);
      throw new Error('Failed to create newsletter');
    }
  }

  /**
   * Update an existing newsletter
   */
  async updateNewsletter(input: UpdateNewsletterInput): Promise<Newsletter> {
    try {
      const { id, ...updateData } = input;

      if (!id) {
        throw new Error('Newsletter ID is required');
      }

      const docRef = this.newslettersCollection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Newsletter not found');
      }

      const updates: any = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      // Handle scheduledFor: convert to Timestamp or delete if null
      if (updateData.scheduledFor !== undefined) {
        if (updateData.scheduledFor === null) {
          updates.scheduledFor = admin.firestore.FieldValue.delete();
        } else {
          updates.scheduledFor = admin.firestore.Timestamp.fromDate(updateData.scheduledFor);
        }
      }

      // Update slug if title changed
      if (updateData.title) {
        updates.slug = this.generateSlug(updateData.title);
      }

      // Update metadata if content changed
      if (updateData.content) {
        const wordCount = this.countWords(updateData.content);
        const imageCount = this.countImages(updateData.content);
        const readTime = Math.ceil(wordCount / 200);
        updates.metadata = {
          readTime,
          wordCount,
          imageCount,
        };
      }

      // Set publishedAt if status changed to published
      if (updateData.status === 'published' && doc.data()?.status !== 'published') {
        updates.publishedAt =
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp;
      }

      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );

      await docRef.update(filteredUpdates);

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Newsletter;
    } catch (error) {
      console.error('Error updating newsletter:', error);
      throw new Error('Failed to update newsletter');
    }
  }

  /**
   * Get a newsletter by ID
   */
  async getNewsletter(id: string): Promise<Newsletter | null> {
    try {
      const doc = await this.newslettersCollection.doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Newsletter;
    } catch (error) {
      console.error('Error getting newsletter:', error);
      throw new Error('Failed to get newsletter');
    }
  }

  /**
   * Get newsletter by slug
   */
  async getNewsletterBySlug(slug: string): Promise<Newsletter | null> {
    try {
      console.log('[NewsletterService] Fetching by slug:', slug);

      const snapshot = await this.newslettersCollection.where('slug', '==', slug).limit(1).get();

      if (snapshot.empty) {
        console.log('[NewsletterService] No newsletter found with slug:', slug);
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // console.log('[NewsletterService] Newsletter found:', {
      //   id: doc.id,
      //   title: data.title,
      //   status: data.status,
      // });

      return {
        id: doc.id,
        ...data,
      } as Newsletter;
    } catch (error) {
      console.error('[NewsletterService] Error getting newsletter by slug:', {
        slug,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to get newsletter with slug: ${slug}`);
    }
  }

  /**
   * List newsletters with pagination and filters
   */
  async listNewsletters(options?: {
    status?: 'draft' | 'published' | 'scheduled';
    authorId?: string;
    limit?: number;
    startAfter?: string;
  }): Promise<{ newsletters: Newsletter[]; hasMore: boolean }> {
    try {
      let query: admin.firestore.Query = this.newslettersCollection;

      if (options?.status) {
        query = query.where('status', '==', options.status);
      }

      if (options?.authorId) {
        query = query.where('authorId', '==', options.authorId);
      }

      query = query.orderBy('createdAt', 'desc');

      const limit = options?.limit || 20;
      query = query.limit(limit + 1); // Fetch one extra to check if there are more

      if (options?.startAfter) {
        const startDoc = await this.newslettersCollection.doc(options.startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      const snapshot = await query.get();
      const newsletters = snapshot.docs.slice(0, limit).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Newsletter[];

      const hasMore = snapshot.docs.length > limit;

      return { newsletters, hasMore };
    } catch (error) {
      console.error('Error listing newsletters:', error);
      throw new Error('Failed to list newsletters');
    }
  }

  /**
   * Delete a newsletter and cleanup all associated resources
   */
  async deleteNewsletter(id: string): Promise<void> {
    try {
      // First, get the newsletter to extract image URLs
      const doc = await this.newslettersCollection.doc(id).get();

      if (!doc.exists) {
        throw new Error('Newsletter not found');
      }

      const newsletter = doc.data() as Newsletter;

      // Extract and delete images from R2 storage
      await this.deleteNewsletterImages(newsletter);

      // Delete the newsletter document
      await this.newslettersCollection.doc(id).delete();

      console.log(
        `[NewsletterService] Successfully deleted newsletter ${id} and cleaned up resources`
      );
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      throw new Error('Failed to delete newsletter');
    }
  }

  /**
   * Extract and delete all images associated with a newsletter
   */
  private async deleteNewsletterImages(newsletter: Newsletter): Promise<void> {
    try {
      const imageUrls: string[] = [];

      // Extract thumbnail URL
      if (newsletter.thumbnail) {
        imageUrls.push(newsletter.thumbnail);
      }

      // Extract images from content (both markdown and HTML)
      if (newsletter.content) {
        // Extract from HTML img tags
        const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/g;
        let match;
        while ((match = htmlImgRegex.exec(newsletter.content)) !== null) {
          imageUrls.push(match[1]);
        }

        // Extract from markdown image syntax ![alt](url)
        const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        while ((match = mdImgRegex.exec(newsletter.content)) !== null) {
          imageUrls.push(match[2]);
        }
      }

      // Filter URLs to only include images from our R2 storage
      // Expected format: https://pub-80b14eac0e644afab28d83edb15a62be.r2.dev/newsletter-images/...
      const r2ImageKeys = imageUrls
        .filter((url) => url.includes('.r2.dev/') || url.includes('r2.cloudflarestorage.com/'))
        .map((url) => {
          // Extract the key (path after the domain)
          try {
            const urlObj = new URL(url);
            return urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
          } catch {
            return null;
          }
        })
        .filter((key): key is string => key !== null);

      if (r2ImageKeys.length > 0) {
        console.log(
          `[NewsletterService] Deleting ${r2ImageKeys.length} images from R2 for newsletter ${newsletter.id}`
        );

        // Import R2Service dynamically to avoid circular dependencies
        const { DeleteObjectsCommand, S3Client } = await import('@aws-sdk/client-s3');

        // Initialize R2 client
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: false,
        });

        const bucketName = process.env.R2_IMAGE_BUCKET_NAME || process.env.R2_BUCKET_NAME;

        // Delete images in batches of 1000 (S3/R2 limit)
        const batchSize = 1000;
        for (let i = 0; i < r2ImageKeys.length; i += batchSize) {
          const batch = r2ImageKeys.slice(i, i + batchSize);

          const command = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: true,
            },
          });

          await r2Client.send(command);
          console.log(`[NewsletterService] Deleted batch of ${batch.length} images from R2`);
        }
      }
    } catch (error) {
      // Log error but don't throw - we still want to delete the newsletter even if image cleanup fails
      console.error('[NewsletterService] Error deleting newsletter images:', error);
    }
  }

  /**
   * Publish a draft newsletter
   */
  async publishNewsletter(id: string): Promise<Newsletter> {
    try {
      const docRef = this.newslettersCollection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Newsletter not found');
      }

      await docRef.update({
        status: 'published',
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Newsletter;
    } catch (error) {
      console.error('Error publishing newsletter:', error);
      throw new Error('Failed to publish newsletter');
    }
  }

  /**
   * Get all scheduled newsletters that are due for publishing
   * Returns newsletters with status 'scheduled' and scheduledFor <= current time
   */
  async getScheduledNewslettersDue(): Promise<Newsletter[]> {
    try {
      const now = admin.firestore.Timestamp.now();

      console.log('[NewsletterService] Fetching scheduled newsletters due for publishing...');

      const snapshot = await this.newslettersCollection
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now)
        .orderBy('scheduledFor', 'asc')
        .get();

      const newsletters: Newsletter[] = [];

      snapshot.forEach((doc) => {
        newsletters.push({
          id: doc.id,
          ...doc.data(),
        } as Newsletter);
      });

      console.log(
        `[NewsletterService] Found ${newsletters.length} scheduled newsletters due for publishing`
      );

      return newsletters;
    } catch (error) {
      console.error('[NewsletterService] Error fetching scheduled newsletters:', error);
      throw new Error('Failed to fetch scheduled newsletters');
    }
  }

  /**
   * Increment newsletter views with deduplication
   * Uses a subcollection to track unique views and prevent duplicate counting
   * @param id - Newsletter ID
   * @param viewerId - Unique identifier for the viewer (session ID, IP hash, or user ID)
   * @returns Object indicating if view was counted and current total views
   */
  async incrementViews(
    id: string,
    viewerId: string
  ): Promise<{ counted: boolean; totalViews: number }> {
    try {
      // Validate inputs
      if (!id || !viewerId) {
        console.error('Invalid parameters for incrementViews', { id, viewerId });
        return { counted: false, totalViews: 0 };
      }

      const docRef = this.newslettersCollection.doc(id);
      const viewsRef = docRef.collection('viewTracking').doc(viewerId);

      // Use a transaction to ensure atomicity
      const result = await this.db.runTransaction(async (transaction) => {
        // Check if newsletter exists
        const newsletterDoc = await transaction.get(docRef);
        if (!newsletterDoc.exists) {
          throw new Error(`Newsletter ${id} not found`);
        }

        // Check if this viewer has already viewed this newsletter
        const viewDoc = await transaction.get(viewsRef);

        const currentViews = (newsletterDoc.data()?.views as number) || 0;

        if (viewDoc.exists) {
          // Already viewed - check if we should count it again (e.g., after 24 hours)
          const lastViewedAt = viewDoc.data()?.viewedAt?.toMillis() || 0;
          const now = Date.now();
          const hoursSinceLastView = (now - lastViewedAt) / (1000 * 60 * 60);

          // Only count as new view if more than 24 hours have passed
          if (hoursSinceLastView < 24) {
            return { counted: false, totalViews: currentViews };
          }
        }

        // Increment view count
        transaction.update(docRef, {
          views: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Record this view
        transaction.set(
          viewsRef,
          {
            viewedAt: admin.firestore.FieldValue.serverTimestamp(),
            viewerId,
          },
          { merge: true }
        );

        return { counted: true, totalViews: currentViews + 1 };
      });

      return result;
    } catch (error) {
      console.error('Error incrementing views:', {
        id,
        viewerId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Return gracefully instead of throwing to not break the API response
      return { counted: false, totalViews: 0 };
    }
  }

  /**
   * Get total unique viewers for a newsletter
   */
  async getUniqueViewers(id: string): Promise<number> {
    try {
      const viewsSnapshot = await this.newslettersCollection
        .doc(id)
        .collection('viewTracking')
        .count()
        .get();

      return viewsSnapshot.data().count;
    } catch (error) {
      console.error('Error getting unique viewers:', error);
      return 0;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Count words in HTML content
   */
  private countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, ' '); // Remove HTML tags
    const words = text.trim().split(/\s+/);
    return words.filter((word) => word.length > 0).length;
  }

  /**
   * Count images in HTML content
   */
  private countImages(html: string): number {
    const imgMatches = html.match(/<img[^>]*>/g);
    return imgMatches ? imgMatches.length : 0;
  }
}
