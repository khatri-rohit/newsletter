// ==========================================
// FIREBASE ADMIN SINGLETON
// ==========================================
// Ensures Firebase Admin is initialized only once across the application

import * as admin from 'firebase-admin';

let firebaseAdmin: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Check if app already exists
    if (admin.apps.length > 0 && admin.apps[0]) {
      firebaseAdmin = admin.apps[0];
      return firebaseAdmin;
    }

    // Validate environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase Admin credentials. Please check your environment variables.'
      );
    }

    // Initialize Firebase Admin
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    console.log('Firebase Admin initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

// Export commonly used services
export function getFirestore(): admin.firestore.Firestore {
  const app = getFirebaseAdmin();
  return admin.firestore(app);
}

export function getAuth(): admin.auth.Auth {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}

// Firestore query optimization utilities
export class FirestoreOptimizer {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Batch get documents by IDs (more efficient than individual gets)
   */
  async batchGet(collection: string, ids: string[]): Promise<admin.firestore.DocumentSnapshot[]> {
    if (ids.length === 0) return [];

    const refs = ids.map((id) => this.db.collection(collection).doc(id));
    return this.db.getAll(...refs);
  }

  /**
   * Paginated query with cursor
   */
  async paginatedQuery<T>(
    collectionRef: admin.firestore.CollectionReference,
    options: {
      limit: number;
      cursor?: admin.firestore.DocumentSnapshot;
      orderBy?: string;
      direction?: 'asc' | 'desc';
      filters?: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: unknown;
      }>;
    }
  ): Promise<{
    data: T[];
    hasMore: boolean;
    lastDoc: admin.firestore.DocumentSnapshot | null;
  }> {
    let query: admin.firestore.Query = collectionRef;

    // Apply filters
    if (options.filters) {
      options.filters.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.direction || 'desc');
    }

    // Apply cursor
    if (options.cursor) {
      query = query.startAfter(options.cursor);
    }

    // Fetch one extra to check if there are more results
    query = query.limit(options.limit + 1);

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > options.limit;
    const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

    const data = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    return {
      data,
      hasMore,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    };
  }

  /**
   * Batch write operations (create, update, delete)
   */
  async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      id?: string;
      data?: Record<string, unknown>;
    }>
  ): Promise<void> {
    const batch = this.db.batch();

    operations.forEach((op) => {
      const ref = op.id
        ? this.db.collection(op.collection).doc(op.id)
        : this.db.collection(op.collection).doc();

      switch (op.type) {
        case 'create':
          if (op.data) {
            batch.set(ref, op.data);
          }
          break;
        case 'update':
          if (op.data) {
            batch.update(ref, op.data);
          }
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    });

    await batch.commit();
  }

  /**
   * Count documents in a collection (for large collections, use aggregation)
   */
  async countDocuments(
    collectionRef: admin.firestore.CollectionReference,
    filters?: Array<{
      field: string;
      operator: admin.firestore.WhereFilterOp;
      value: unknown;
    }>
  ): Promise<number> {
    let query: admin.firestore.Query = collectionRef;

    if (filters) {
      filters.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  }
}

export const firestoreOptimizer = new FirestoreOptimizer();
